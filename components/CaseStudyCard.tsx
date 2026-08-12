import type { CaseStudySection } from "@/lib/types";
import MarkdownText from "./MarkdownText";

export default function CaseStudyCard({ section }: { section: CaseStudySection }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <span className="font-mono text-xs uppercase tracking-widest text-accent">
        Case study
      </span>
      <h3 className="mt-1.5 text-xl font-medium text-ink">{section.title}</h3>
      <div className="prose-portal mt-3">
        <MarkdownText text={section.body} />
      </div>
      {section.source && (
        <p className="mt-2 text-xs text-paper-400">Nguồn: {section.source}</p>
      )}
    </div>
  );
}
