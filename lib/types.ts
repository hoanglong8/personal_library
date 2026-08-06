export type SectionType =
  | "concept"
  | "framework"
  | "case-study"
  | "exercise"
  | "note";

export type NoteVariant = "tip" | "warning" | "definition";

export interface BaseSection {
  id: string;
  type: SectionType;
  title: string;
}

export interface ConceptSection extends BaseSection {
  type: "concept";
  body: string;
}

export interface FrameworkSection extends BaseSection {
  type: "framework";
  intro?: string;
  steps: string[];
}

export interface CaseStudySection extends BaseSection {
  type: "case-study";
  body: string;
  source?: string;
}

export interface ExerciseSection extends BaseSection {
  type: "exercise";
  prompt: string;
  hint?: string;
  answer?: string;
}

export interface NoteSection extends BaseSection {
  type: "note";
  body: string;
  variant: NoteVariant;
}

export type Section =
  | ConceptSection
  | FrameworkSection
  | CaseStudySection
  | ExerciseSection
  | NoteSection;

export interface Module {
  id: string;
  title: string;
  summary: string;
  sections: Section[];
}

export interface PortalStat {
  label: string;
  value: string;
}

export interface PortalMeta {
  title: string;
  subtitle: string;
  sourceLabel: string;
  disclaimer?: string;
  stats: PortalStat[];
}

export interface Book {
  slug: string;
  meta: PortalMeta;
  modules: Module[];
}

export interface SiteData {
  siteTitle: string;
  siteSubtitle?: string;
  books: Book[];
}
