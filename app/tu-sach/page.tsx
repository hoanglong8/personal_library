"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Book } from "@/lib/types";

interface ResolvedBookmark {
  bookSlug: string;
  bookTitle: string;
  moduleId: string;
  moduleTitle: string;
  sectionId: string;
  sectionTitle: string;
}

interface BookGroup {
  bookSlug: string;
  bookTitle: string;
  items: ResolvedBookmark[];
}

function groupByBook(items: ResolvedBookmark[]): BookGroup[] {
  const groups = new Map<string, BookGroup>();
  for (const item of items) {
    const existing = groups.get(item.bookSlug);
    if (existing) existing.items.push(item);
    else groups.set(item.bookSlug, { bookSlug: item.bookSlug, bookTitle: item.bookTitle, items: [item] });
  }
  return Array.from(groups.values());
}

export default function TuSachPage() {
  const session = useSession();
  // undefined = not fetched yet (covers both "still resolving session" and
  // "resolved but not signed in", since we don't fetch in either case);
  // [] = signed in with no bookmarks yet. Whether to show the "đăng nhập"
  // message is driven straight off `session` below, not encoded into this.
  const [items, setItems] = useState<ResolvedBookmark[] | undefined>(undefined);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(bookSlug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(bookSlug)) next.delete(bookSlug);
      else next.add(bookSlug);
      return next;
    });
  }

  useEffect(() => {
    if (!supabase || !session) return;
    let active = true;

    (async () => {
      const client = supabase;
      if (!client) return;

      const { data: bookmarks } = await client
        .from("bookmarks")
        .select("book_id, section_id, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!bookmarks || bookmarks.length === 0) {
        if (active) setItems([]);
        return;
      }

      const bookSlugs = Array.from(new Set(bookmarks.map((b) => b.book_id)));
      const { data: books } = await client
        .from("books")
        .select("slug, data")
        .in("slug", bookSlugs);

      const bookMap = new Map(
        (books ?? []).map((row) => [row.slug as string, row.data as Omit<Book, "slug">])
      );

      const resolved: ResolvedBookmark[] = [];
      for (const bm of bookmarks) {
        const book = bookMap.get(bm.book_id);
        if (!book) continue;
        for (const mod of book.modules) {
          const section = mod.sections.find((s) => s.id === bm.section_id);
          if (section) {
            resolved.push({
              bookSlug: bm.book_id,
              bookTitle: book.meta.title,
              moduleId: mod.id,
              moduleTitle: mod.title,
              sectionId: bm.section_id,
              sectionTitle: section.title,
            });
            break;
          }
        }
      }

      if (active) setItems(resolved);
    })();

    return () => {
      active = false;
    };
  }, [session]);

  if (!isSupabaseConfigured) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm text-paper-400">Tính năng chưa được kích hoạt.</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-2xl font-semibold text-ink">Tuyển tập của tôi</h1>
        <p className="mt-4 text-sm text-paper-400">
          Đăng nhập ở góc trên để xem các mục bạn đã đánh dấu.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-2xl font-semibold text-ink">Tuyển tập của tôi</h1>

      {items === undefined && (
        <p className="mt-4 text-sm text-paper-400">Đang tải...</p>
      )}

      {items?.length === 0 && (
        <p className="mt-4 text-sm text-paper-400">
          Chưa có mục nào được đánh dấu — bấm &ldquo;☆ Lưu vào tuyển tập&rdquo; ở cuối
          một mục bất kỳ khi đang đọc.
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {groupByBook(items ?? []).map((group) => {
          const isOpen = expanded.has(group.bookSlug);
          return (
            <li key={group.bookSlug} className="rounded-xl border border-border">
              <button
                onClick={() => toggleExpanded(group.bookSlug)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span>
                  <span className="font-medium text-ink">{group.bookTitle}</span>{" "}
                  <span className="text-xs text-paper-400">
                    ({group.items.length} mục đã lưu)
                  </span>
                </span>
                <span className="text-xs text-paper-400">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <ul className="space-y-3 border-t border-border p-4 pt-3">
                  {group.items.map((item) => (
                    <li key={`${item.bookSlug}-${item.sectionId}`}>
                      <Link
                        href={`/${item.bookSlug}/modules/${item.moduleId}#${item.sectionId}`}
                        className="block font-medium text-ink hover:text-accent"
                      >
                        {item.sectionTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-paper-400">{item.moduleTitle}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
