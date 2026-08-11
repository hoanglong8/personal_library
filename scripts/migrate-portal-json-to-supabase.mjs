// One-time migration: content/portal.json -> Supabase table `books`.
//
// Run once, after `supabase/books-schema.sql` has been executed in the
// Supabase SQL editor. Requires the service_role key (bypasses RLS — see
// lib/supabaseAdminClient.ts for why the anon key can't write here).
//
// Usage (Node 20.6+ / 22+ needed for --env-file, this project runs on
// Node 24):
//   node --env-file=.env.local scripts/migrate-portal-json-to-supabase.mjs
//
// Safe to re-run: upserts by `slug`, so re-running after fixing content/
// portal.json just overwrites the same rows instead of duplicating them.

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong " +
      "môi trường. Chạy lại với: node --env-file=.env.local " +
      "scripts/migrate-portal-json-to-supabase.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
});

const raw = await readFile(new URL("../content/portal.json", import.meta.url), "utf-8");
const portal = JSON.parse(raw);

if (!Array.isArray(portal.books) || portal.books.length === 0) {
  console.error("content/portal.json không có mảng `books` hoặc rỗng — dừng lại.");
  process.exit(1);
}

console.log(`Tìm thấy ${portal.books.length} sách trong content/portal.json:`);
for (const book of portal.books) {
  console.log(`  - ${book.slug} (${book.meta?.title ?? "không có title"})`);
}

const rows = portal.books.map((book) => ({
  slug: book.slug,
  data: { meta: book.meta, modules: book.modules },
  status: "published",
  source: "manual",
}));

const { data, error } = await supabase
  .from("books")
  .upsert(rows, { onConflict: "slug" })
  .select("slug, status");

if (error) {
  console.error("Migrate thất bại:", error.message);
  process.exit(1);
}

console.log(`\nĐã upsert ${data.length} dòng vào bảng books:`);
for (const row of data) {
  console.log(`  - ${row.slug} -> status=${row.status}`);
}

const { count, error: countError } = await supabase
  .from("books")
  .select("slug", { count: "exact", head: true })
  .eq("status", "published");

if (countError) {
  console.error("Không đếm lại được số sách published:", countError.message);
  process.exit(1);
}

if (count !== portal.books.length) {
  console.error(
    `CẢNH BÁO: bảng books có ${count} dòng published, nhưng portal.json có ` +
      `${portal.books.length} sách — kiểm tra lại trước khi coi migrate là xong.`
  );
  process.exit(1);
}

console.log(`\nXác nhận: bảng books có đúng ${count} sách published. Migrate xong.`);
