import type { Section } from "@/lib/types";
import ConceptBlock from "./ConceptBlock";
import FrameworkCard from "./FrameworkCard";
import CaseStudyCard from "./CaseStudyCard";
import ExerciseCard from "./ExerciseCard";
import NoteCallout from "./NoteCallout";
import CommentThread from "./CommentThread";

export default function SectionRenderer({ section }: { section: Section }) {
  return (
    <div id={section.id} className="scroll-mt-24">
      {section.type === "concept" && <ConceptBlock section={section} />}
      {section.type === "framework" && <FrameworkCard section={section} />}
      {section.type === "case-study" && <CaseStudyCard section={section} />}
      {section.type === "exercise" && <ExerciseCard section={section} />}
      {section.type === "note" && <NoteCallout section={section} />}
      <CommentThread sectionId={section.id} />
    </div>
  );
}
