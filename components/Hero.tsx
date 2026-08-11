import Link from "next/link";
import type { PortalMeta, Module } from "@/lib/types";
import HeroActions from "./HeroActions";

export default function Hero({
  meta,
  modules,
  firstModule,
  bookSlug,
}: {
  meta: PortalMeta;
  modules: Module[];
  firstModule?: Module;
  bookSlug: string;
}) {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <Link href="/" className="text-xs text-paper-400 hover:text-accent">
          ← Thư viện
        </Link>
        <p className="mt-4 text-xs font-mono uppercase tracking-widest text-accent">
          {meta.sourceLabel}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {meta.title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">{meta.subtitle}</p>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono text-paper-400">
          {meta.stats.map((s) => (
            <span key={s.label}>
              <span className="text-ink">{s.value}</span> {s.label}
            </span>
          ))}
        </div>

        {firstModule && (
          <Link
            href={`/${bookSlug}/modules/${firstModule.id}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink hover:opacity-90 transition-opacity"
          >
            Bắt đầu: {firstModule.title} →
          </Link>
        )}

        {meta.disclaimer && (
          <p className="mt-6 text-xs text-paper-400">{meta.disclaimer}</p>
        )}

        <HeroActions bookSlug={bookSlug} modules={modules} />
      </div>
    </section>
  );
}
