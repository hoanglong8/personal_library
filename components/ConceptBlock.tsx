import type { ConceptSection } from "@/lib/types";

export default function ConceptBlock({ section }: { section: ConceptSection }) {
  return (
    <div>
      <h3 className="text-xl font-medium text-ink">{section.title}</h3>
      <div className="prose-portal mt-3">
        {section.body.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}
