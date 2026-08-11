import type { Section } from "@/lib/types";
import ConceptBlock from "./ConceptBlock";
import FrameworkCard from "./FrameworkCard";
import CaseStudyCard from "./CaseStudyCard";
import ExerciseCard from "./ExerciseCard";
import NoteCallout from "./NoteCallout";
import ImageBlock from "./ImageBlock";
import CommentThread from "./CommentThread";
import BookmarkButton from "./BookmarkButton";

export default function SectionRenderer({
  section,
  bookSlug,
}: {
  section: Section;
  bookSlug: string;
}) {
  return (
    <div id={section.id} className="scroll-mt-24">
      {section.type === "concept" && <ConceptBlock section={section} />}
      {section.type === "framework" && <FrameworkCard section={section} />}
      {section.type === "case-study" && <CaseStudyCard section={section} />}
      {section.type === "exercise" && <ExerciseCard section={section} />}
      {section.type === "note" && <NoteCallout section={section} />}
      {section.type === "image" && <ImageBlock section={section} />}
      <div className="mt-3">
        <BookmarkButton bookSlug={bookSlug} sectionId={section.id} />
      </div>
      <CommentThread bookSlug={bookSlug} sectionId={section.id} />
    </div>
  );
}
