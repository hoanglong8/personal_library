import { unstable_cache } from "next/cache";
import type { Book, Module } from "./types";
import { getServerSupabase } from "./supabaseServerClient";

// Site-level branding — not book content, doesn't need a database row.
export const SITE_TITLE = "Thư viện số";
export const SITE_SUBTITLE =
  "Portal học tập được dựng từ các tài liệu nguồn — mỗi cuốn sách một khu vực riêng.";

// Cached read of every published book. RLS on `books` (see
// supabase/books-schema.sql) already hides drafts from the anon key, so
// there is no separate "published only" filter needed beyond `.eq`.
// revalidate: 60 keeps pages close to static-site speed while letting an
// admin-approved book (or AI job result) show up within a minute without a
// rebuild+redeploy.
const getPublishedBooks = unstable_cache(
  async (): Promise<Book[]> => {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("books")
      .select("slug, data")
      .eq("status", "published")
      .order("slug", { ascending: true });

    if (error) {
      throw new Error(`Không đọc được bảng books từ Supabase: ${error.message}`);
    }

    // `slug` is the table's primary key column, not duplicated inside the
    // jsonb `data` payload (see scripts/migrate-portal-json-to-supabase.mjs)
    // — the Book type needs it merged back in for existing components
    // (BookGrid links, getBook lookups by slug) to work.
    return (data ?? []).map((row) => {
      const bookData = row.data as Omit<Book, "slug">;
      return { slug: row.slug, ...bookData };
    });
  },
  ["published-books"],
  { revalidate: 60, tags: ["books"] }
);

export async function getBooks(): Promise<Book[]> {
  return getPublishedBooks();
}

export async function getBook(bookSlug: string): Promise<Book | undefined> {
  const books = await getBooks();
  return books.find((b) => b.slug === bookSlug);
}

export async function getModule(
  bookSlug: string,
  moduleSlug: string
): Promise<Module | undefined> {
  const book = await getBook(bookSlug);
  return book?.modules.find((m) => m.id === moduleSlug);
}

export async function getAdjacentModules(
  bookSlug: string,
  moduleSlug: string
): Promise<{ prev: Module | null; next: Module | null }> {
  const book = await getBook(bookSlug);
  const modules = book?.modules ?? [];
  const index = modules.findIndex((m) => m.id === moduleSlug);
  return {
    prev: index > 0 ? modules[index - 1] : null,
    next: index >= 0 && index < modules.length - 1 ? modules[index + 1] : null,
  };
}
