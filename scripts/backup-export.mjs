// Runs in GitHub Actions (.github/workflows/backup-and-export.yml), not
// locally. Two independent outputs, deliberately going to different
// destinations (see the workflow file for why):
//
// 1. dist/backup.sql — pg_dump of the `public` schema (books, comments,
//    reading_progress, bookmarks, ai_jobs). Scoped to `public` on purpose:
//    the `auth` schema (which holds actual emails) is never included, but
//    reading_progress/bookmarks still carry a persistent user_id tied to
//    behavior/timestamps — treated as sensitive regardless, goes to the
//    PRIVATE backup repo, never the public one.
// 2. dist/<slug>.md — one file per published book, rendered from the same
//    structured content the site itself renders (see components/
//    PrintView.tsx for the React equivalent of this section-by-type
//    logic) — the "database đã làm sạch dạng gần-markdown" this project's
//    goals call for, and also a portable book export. No personal data,
//    safe to publish as a public GitHub Release asset.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const DIST_DIR = "dist";
mkdirSync(DIST_DIR, { recursive: true });

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Thiếu biến môi trường ${name}.`);
  return value;
}

// --- 1. Postgres dump (public schema only) ---
function dumpDatabase() {
  const dbUrl = requireEnv("SUPABASE_DB_URL");
  const outPath = `${DIST_DIR}/backup.sql`;
  execFileSync(
    "pg_dump",
    [dbUrl, "--schema=public", "--no-owner", "--no-privileges", "--file", outPath],
    { stdio: "inherit" }
  );
  console.log(`Đã dump database vào ${outPath}`);
}

// --- 2. Markdown export of published books ---
function sectionToMarkdown(section) {
  const lines = [`### ${section.title || "(không có tiêu đề)"}`, ""];
  switch (section.type) {
    case "concept":
    case "case-study":
      lines.push(section.body);
      if (section.type === "case-study" && section.source) {
        lines.push("", `_Nguồn: ${section.source}_`);
      }
      break;
    case "framework":
      if (section.intro) lines.push(section.intro, "");
      (section.steps ?? []).forEach((step, i) => lines.push(`${i + 1}. ${step}`));
      break;
    case "exercise":
      lines.push(section.prompt);
      if (section.hint) lines.push("", `**Gợi ý:** ${section.hint}`);
      if (section.answer) lines.push("", `**Đáp án tham khảo:** ${section.answer}`);
      break;
    case "note":
      lines.push(section.body);
      break;
    case "image":
      lines.push(`![${section.alt ?? ""}](${section.url})`);
      if (section.caption) lines.push("", `_${section.caption}_`);
      break;
  }
  return lines.join("\n");
}

function bookToMarkdown(book) {
  const meta = book.meta;
  const parts = [`# ${meta.title}`, "", meta.subtitle, ""];
  if (meta.author) parts.push(`_Tác giả: ${meta.author}_`, "");
  parts.push("## Mục lục", "");
  book.modules.forEach((m, i) => parts.push(`${i + 1}. ${m.title}`));
  parts.push("");
  for (const mod of book.modules) {
    parts.push(`## ${mod.title}`, "", mod.summary, "");
    for (const section of mod.sections) {
      parts.push(sectionToMarkdown(section), "");
    }
  }
  return parts.join("\n");
}

async function exportMarkdown() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const res = await fetch(`${url}/rest/v1/books?select=slug,data&status=eq.published`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) {
    throw new Error(`Đọc bảng books thất bại: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();

  for (const row of rows) {
    const md = bookToMarkdown(row.data);
    writeFileSync(`${DIST_DIR}/${row.slug}.md`, md, "utf-8");
    console.log(`Đã xuất ${DIST_DIR}/${row.slug}.md`);
  }
  console.log(`Tổng cộng ${rows.length} sách published đã xuất .md.`);
}

dumpDatabase();
await exportMarkdown();
