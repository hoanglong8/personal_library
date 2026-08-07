"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { CATEGORY_TREE } from "@/lib/categories";
import CategorySidebar from "./CategorySidebar";
import BookThumbnail from "./BookThumbnail";

type SortOrder = "newest" | "oldest" | "title";

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function BookGrid({ books }: { books: Book[] }) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => b.meta.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [books]);

  const countByDomain = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.meta.domain) counts[b.meta.domain] = (counts[b.meta.domain] ?? 0) + 1;
    });
    return counts;
  }, [books]);

  const countByField = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.meta.field) counts[b.meta.field] = (counts[b.meta.field] ?? 0) + 1;
    });
    return counts;
  }, [books]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = books.filter((b) => {
      const haystack = [b.meta.title, b.meta.author, b.meta.subtitle, b.meta.sourceLabel]
        .filter((v): v is string => Boolean(v))
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesTags =
        activeTags.length === 0 ||
        activeTags.every((t) => b.meta.tags?.includes(t));
      const matchesDomain = !selectedDomain || b.meta.domain === selectedDomain;
      const matchesField = !selectedField || b.meta.field === selectedField;
      return matchesQuery && matchesTags && matchesDomain && matchesField;
    });

    return [...matches].sort((a, b) => {
      if (sort === "title") return a.meta.title.localeCompare(b.meta.title, "vi");
      const da = a.meta.publishedAt ?? "";
      const db = b.meta.publishedAt ?? "";
      return sort === "newest" ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [books, query, activeTags, sort, selectedDomain, selectedField]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <section className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 lg:flex lg:items-start lg:gap-8">
      <CategorySidebar
        tree={CATEGORY_TREE}
        countByDomain={countByDomain}
        countByField={countByField}
        selectedDomain={selectedDomain}
        selectedField={selectedField}
        onSelectDomain={setSelectedDomain}
        onSelectField={setSelectedField}
      />

      <div className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold text-ink">Thư viện số</h1>
        <p className="mt-2 text-ink-soft">Chọn một cuốn sách để bắt đầu học.</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên sách, tác giả..."
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="title">Theo tên (A-Z)</option>
          </select>
        </div>

        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border text-paper-400 hover:border-accent hover:text-accent"
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-xs text-paper-400">
          {filtered.length}/{books.length} sách
        </p>

        {filtered.length === 0 ? (
          <p className="mt-6 text-sm text-ink-soft">
            Không tìm thấy sách phù hợp — thử đổi từ khoá hoặc bỏ bớt bộ lọc.
          </p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((book) => {
            const date = formatDate(book.meta.publishedAt);
            return (
              <Link
                key={book.slug}
                href={`/${book.slug}`}
                className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent"
              >
                <BookThumbnail src={book.meta.thumbnail} alt={book.meta.title} />

                <div className="p-6">
                  <h2 className="text-xl font-medium text-ink group-hover:text-accent transition-colors">
                    {book.meta.title}
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">
                    {book.meta.subtitle}
                  </p>

                  {(book.meta.author || date) && (
                    <p className="mt-2 text-xs text-paper-400">
                      {book.meta.author}
                      {book.meta.author && date ? " · " : ""}
                      {date}
                    </p>
                  )}

                  {book.meta.tags && book.meta.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {book.meta.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[11px] text-accent"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-paper-400">
                    {book.meta.stats.map((s) => (
                      <span key={s.label}>
                        <span className="text-ink">{s.value}</span> {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </section>
  );
}
