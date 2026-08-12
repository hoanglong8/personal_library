"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/adminFetch";
import type { Book } from "@/lib/types";

interface BookRow {
  slug: string;
  status: "draft" | "reviewed" | "published";
  source: string;
  data: Omit<Book, "slug">;
  pending_data: Omit<Book, "slug"> | null;
  updated_at: string;
}

function StarButton({
  book,
  busy,
  onToggle,
}: {
  book: BookRow;
  busy: boolean;
  onToggle: (slug: string) => void;
}) {
  const featured = Boolean(book.data.meta.featured);
  return (
    <button
      onClick={() => onToggle(book.slug)}
      disabled={busy}
      title={featured ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
      aria-label={featured ? "Bỏ đánh dấu sao" : "Đánh dấu sao"}
      className={`rounded-full border px-3 py-1.5 text-xs disabled:opacity-50 ${
        featured
          ? "border-accent bg-accent-soft text-accent"
          : "border-border text-ink-soft hover:border-accent hover:text-accent"
      }`}
    >
      {featured ? "★" : "☆"}
    </button>
  );
}

function MetaDiffLine({
  label,
  current,
  proposed,
}: {
  label: string;
  current: string | undefined;
  proposed: string | undefined;
}) {
  if (proposed === undefined || proposed === current) return null;
  return (
    <p className="mt-1 text-xs text-ink-soft">
      <span className="font-medium text-ink">{label}:</span>{" "}
      <span className="text-paper-400 line-through">{current ?? "(trống)"}</span>{" "}
      → <span className="text-accent">{proposed}</span>
    </p>
  );
}

export default function AdminDraftsPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await adminFetch("/api/admin/drafts");
    const body = await res.json();
    if (res.ok) setBooks(body.drafts);
    else setError(body.error ?? "Lỗi không rõ.");
  }

  useEffect(() => {
    // Inlined rather than calling refresh() here — see the same note in
    // app/admin/jobs/page.tsx for why. refresh() stays as-is for reuse
    // from the action handlers below, which aren't effects.
    adminFetch("/api/admin/drafts").then(async (res) => {
      const body = await res.json();
      if (res.ok) setBooks(body.drafts);
      else setError(body.error ?? "Lỗi không rõ.");
    });
  }, []);

  async function runAction(slug: string, action: "approve" | "publish" | "unpublish" | "reject") {
    setBusySlug(slug);
    setError(null);
    const res = await adminFetch(`/api/admin/books/${slug}/${action}`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusySlug(null);
    if (!res.ok) {
      setError(body.error ?? `${action} thất bại.`);
      return;
    }
    await refresh();
  }

  async function toggleStar(slug: string) {
    setBusySlug(slug);
    setError(null);
    const res = await adminFetch(`/api/admin/books/${slug}/star`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusySlug(null);
    if (!res.ok) {
      setError(body.error ?? "Đánh dấu sao thất bại.");
      return;
    }
    await refresh();
  }


  const needsReview = books.filter((b) => b.status === "draft" || b.pending_data);
  const reviewed = books.filter((b) => b.status === "reviewed");
  const live = books.filter((b) => b.status === "published");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">Quản lý nội dung</h1>
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <section className="mt-8">
        <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
          Chờ duyệt ({needsReview.length})
        </h2>
        {needsReview.length === 0 && (
          <p className="mt-2 text-sm text-paper-400">Không có gì chờ duyệt.</p>
        )}
        <ul className="mt-4 space-y-4">
          {needsReview.map((b) => (
            <li key={b.slug} className="rounded-xl border border-border p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-accent">
                    {b.status === "draft" ? "Sách mới (chưa duyệt)" : "Đề xuất chỉnh sửa"}
                  </p>
                  <h3 className="mt-1 font-medium text-ink">
                    {b.data.meta.featured && <span className="mr-1 text-accent">★</span>}
                    {b.data.meta.title}
                  </h3>
                  <p className="text-xs text-paper-400">
                    slug: {b.slug} · nguồn: {b.source}
                  </p>
                </div>
                <div className="flex gap-2">
                  <StarButton book={b} busy={busySlug === b.slug} onToggle={toggleStar} />
                  <Link
                    href={`/admin/edit/${b.slug}`}
                    className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-accent hover:text-accent"
                  >
                    Sửa nội dung
                  </Link>
                  <button
                    onClick={() => runAction(b.slug, "approve")}
                    disabled={busySlug === b.slug}
                    className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-ink disabled:opacity-50"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => runAction(b.slug, "reject")}
                    disabled={busySlug === b.slug}
                    className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-danger hover:text-danger disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </div>

              {b.status === "draft" ? (
                <p className="mt-3 text-sm text-ink-soft">{b.data.meta.subtitle}</p>
              ) : b.pending_data ? (
                <div className="mt-3">
                  <MetaDiffLine
                    label="Mô tả"
                    current={b.data.meta.subtitle}
                    proposed={b.pending_data.meta.subtitle}
                  />
                  <MetaDiffLine
                    label="Tag"
                    current={b.data.meta.tags?.join(", ")}
                    proposed={b.pending_data.meta.tags?.join(", ")}
                  />
                  <MetaDiffLine
                    label="Domain"
                    current={b.data.meta.domain}
                    proposed={b.pending_data.meta.domain}
                  />
                  <MetaDiffLine
                    label="Field"
                    current={b.data.meta.field}
                    proposed={b.pending_data.meta.field}
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
          Đã duyệt, chờ công khai ({reviewed.length})
        </h2>
        {reviewed.length === 0 && (
          <p className="mt-2 text-sm text-paper-400">Không có sách nào ở trạng thái này.</p>
        )}
        <ul className="mt-4 space-y-4">
          {reviewed.map((b) => (
            <li
              key={b.slug}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-5"
            >
              <div>
                <h3 className="font-medium text-ink">
                  {b.data.meta.featured && <span className="mr-1 text-accent">★</span>}
                  {b.data.meta.title}
                </h3>
                <p className="text-xs text-paper-400">
                  slug: {b.slug} · nguồn: {b.source}
                </p>
              </div>
              <div className="flex gap-2">
                <StarButton book={b} busy={busySlug === b.slug} onToggle={toggleStar} />
                <Link
                  href={`/admin/edit/${b.slug}`}
                  className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-accent hover:text-accent"
                >
                  Sửa nội dung
                </Link>
                <button
                  onClick={() => runAction(b.slug, "publish")}
                  disabled={busySlug === b.slug}
                  className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-ink disabled:opacity-50"
                >
                  Publish
                </button>
                <button
                  onClick={() => runAction(b.slug, "reject")}
                  disabled={busySlug === b.slug}
                  className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  Xoá
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
          Đang công khai ({live.length})
        </h2>
        <ul className="mt-4 space-y-4">
          {live.map((b) => (
            <li
              key={b.slug}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-5"
            >
              <div>
                <h3 className="font-medium text-ink">
                  {b.data.meta.featured && <span className="mr-1 text-accent">★</span>}
                  {b.data.meta.title}
                </h3>
                <p className="text-xs text-paper-400">
                  slug: {b.slug} · nguồn: {b.source}
                  {b.pending_data && (
                    <span className="text-accent"> · có đề xuất chỉnh sửa đang chờ duyệt</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <StarButton book={b} busy={busySlug === b.slug} onToggle={toggleStar} />
                <Link
                  href={`/admin/edit/${b.slug}`}
                  className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-accent hover:text-accent"
                >
                  Sửa nội dung
                </Link>
                <button
                  onClick={() => runAction(b.slug, "unpublish")}
                  disabled={busySlug === b.slug}
                  className="rounded-full border border-border px-4 py-1.5 text-xs hover:border-danger hover:text-danger disabled:opacity-50"
                >
                  Ngừng công khai
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
