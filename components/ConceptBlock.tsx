import type { ConceptSection } from "@/lib/types";
import MarkdownText from "./MarkdownText";

export default function ConceptBlock({ section }: { section: ConceptSection }) {
  return (
    <div>
      <h3 className="text-xl font-medium text-ink">{section.title}</h3>
      <div className="prose-portal mt-3">
        <MarkdownText text={section.body} />
      </div>
    </div>
  );
}
