"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";
import { supabase } from "@/lib/supabaseClient";
import { slugify } from "@/lib/slugify";
import { parseMarkdownToModule } from "@/lib/markdownImport";
import type { Book, Module } from "@/lib/types";

interface BookOption {
  slug: string;
  title: string;
}

// For bringing in a whole book translated/authored *outside* the portal
// (e.g. by hand, or with an external tool like silaBook) as a set of .md
// files — one file per chapter. Distinct from the AI "translate" job
// (lib/aiJobs/translate.ts), which calls Gemini itself; this path never
// calls any AI, it only parses markdown the admin already has.
export default function ImportBookPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [lang, setLang] = useState("en");
  const [translationGroup, setTranslationGroup] = useState("");
  const [sourceBooks, setSourceBooks] = useState<BookOption[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("books")
      .select("slug, data")
      .eq("status", "published")
      .then(({ data }) => {
        if (!data) return;
        setSourceBooks(
          data.map((row) => ({
            slug: row.slug as string,
            title: (row.data as { meta?: { title?: string } })?.meta?.title ?? row.slug,
          }))
        );
      });
  }, []);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const existingIds = new Set(modules.map((m) => m.id));
    const newModules: Module[] = [];
    for (const file of files) {
      const text = await file.text();
      const fallbackTitle = file.name.replace(/\.md$/i, "");
      const mod = parseMarkdownToModule(text, fallbackTitle);
      let id = mod.id;
      let suffix = 2;
      while (existingIds.has(id)) {
        id = `${mod.id}-${suffix}`;
        suffix += 1;
      }
      existingIds.add(id);
      newModules.push({ ...mod, id });
    }
    setModules((prev) => [...prev, ...newModules]);
    if (!title && files[0]) setTitle(files[0].name.replace(/\.md$/i, ""));
  }

  function removeModule(i: number) {
    setModules((prev) => prev.filter((_, j) => j !== i));
  }

  // Slug is derived from the title, never typed by the admin — on a
  // collision (same title used twice) we just retry with a numeric suffix
  // instead of surfacing the conflict as something the admin has to solve.
  async function createWithSlug(base: string, data: Omit<Book, "slug">): Promise<string> {
    for (let attempt = 1; attempt <= 20; attempt++) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      const res = await adminFetch("/api/admin/books/create", {
        method: "POST",
        body: JSON.stringify({ slug: candidate, data }),
      });
      if (res.ok) return candidate;
      const body = await res.json().catch(() => ({}));
      if (!/đã tồn tại/.test(body.error ?? "")) {
        throw new Error(body.error ?? "Tạo sách thất bại.");
      }
    }
    throw new Error("Không tìm được slug trống sau nhiều lần thử — đổi tên sách và thử lại.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const baseSlug = slugify(title);
    if (!title.trim() || !baseSlug || !subtitle.trim()) {
      setError("Cần điền tiêu đề và mô tả ngắn.");
      return;
    }
    if (modules.length === 0) {
      setError("Cần nhập ít nhất 1 file .md làm chương.");
      return;
    }

    setSubmitting(true);

    const data: Omit<Book, "slug"> = {
      meta: {
        title: title.trim(),
        subtitle: subtitle.trim(),
        sourceLabel: "Nhập tay từ file .md",
        disclaimer: "Nội dung nhập từ file .md ngoài hệ thống — kiểm tra lại trước khi công khai.",
        stats: [{ label: "chương", value: String(modules.length) }],
        lang: lang.trim() || undefined,
        translationGroup: translationGroup || undefined,
      },
      modules,
    };

    try {
      const slug = await createWithSlug(baseSlug, data);
      router.push(`/admin/edit/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo sách thất bại.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Tiếp nhận nội dung</h1>
      <p className="mt-2 text-sm text-paper-400">
        Dùng khi đã dịch/soạn nội dung ở ngoài (vd bằng silaBook hay công cụ khác) và muốn đưa vào
        portal — mỗi file .md sẽ thành 1 chương. Đường dẫn sách do hệ thống tự đặt theo tên sách.
        Sách tạo ra ở trạng thái nháp, xem lại ở{" "}
        <span className="text-accent">Sửa nội dung</span> trước khi duyệt/công khai.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-border p-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tên sách"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          rows={2}
          placeholder="Mô tả ngắn"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex flex-wrap gap-3">
          <input
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            placeholder="Mã ngôn ngữ, vd en"
            className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={translationGroup}
            onChange={(e) => setTranslationGroup(e.target.value)}
            className="min-w-64 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">— Không phải bản dịch của sách nào —</option>
            {sourceBooks.map((b) => (
              <option key={b.slug} value={b.slug}>
                Bản dịch của: {b.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="cursor-pointer rounded-full border border-dashed border-accent/60 px-4 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft">
            + Chọn file .md (chọn được nhiều file cùng lúc)
            <input
              type="file"
              accept=".md,text/markdown"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        </div>

        {modules.length > 0 && (
          <ul className="space-y-2">
            {modules.map((m, i) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>
                  {i + 1}. {m.title}{" "}
                  <span className="text-xs text-paper-400">({m.sections.length} mục)</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeModule(i)}
                  className="text-xs text-paper-400 hover:text-danger"
                >
                  Xoá
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
        >
          {submitting ? "Đang tạo..." : "Tạo sách nháp"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </div>
  );
}
