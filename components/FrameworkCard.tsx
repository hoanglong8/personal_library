import type { FrameworkSection } from "@/lib/types";

export default function FrameworkCard({ section }: { section: FrameworkSection }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <span className="font-mono text-xs uppercase tracking-widest text-accent">
        Khung kiến thức
      </span>
      <h3 className="mt-1.5 text-xl font-medium text-ink">{section.title}</h3>
      {section.intro && (
        <p className="mt-2 text-sm text-ink-soft">{section.intro}</p>
      )}
      <ol className="mt-4 space-y-3">
        {section.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs text-accent">
              {i + 1}
            </span>
            <span className="text-sm text-ink-soft leading-relaxed pt-0.5">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
