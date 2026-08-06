import Link from "next/link";
import type { Book } from "@/lib/types";

export default function BookGrid({ books }: { books: Book[] }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h1 className="text-3xl font-semibold text-ink">Thư viện portal</h1>
      <p className="mt-2 text-ink-soft">Chọn một cuốn sách để bắt đầu học.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {books.map((book) => (
          <Link
            key={book.slug}
            href={`/${book.slug}`}
            className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-accent">
              {book.meta.sourceLabel}
            </span>
            <h2 className="mt-1.5 text-xl font-medium text-ink group-hover:text-accent transition-colors">
              {book.meta.title}
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">
              {book.meta.subtitle}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-paper-400">
              {book.meta.stats.map((s) => (
                <span key={s.label}>
                  <span className="text-ink">{s.value}</span> {s.label}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
