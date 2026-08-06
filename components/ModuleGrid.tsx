import Link from "next/link";
import type { Module } from "@/lib/types";

export default function ModuleGrid({
  modules,
  bookSlug,
}: {
  modules: Module[];
  bookSlug: string;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
        Mục lục
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {modules.map((m, i) => (
          <Link
            key={m.id}
            href={`/${bookSlug}/modules/${m.id}`}
            className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs text-accent">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 font-medium text-ink group-hover:text-accent transition-colors">
              {m.title}
            </h3>
            <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">
              {m.summary}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
