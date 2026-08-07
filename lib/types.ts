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
  /** Tên tác giả tài liệu nguồn, nếu xác định được. */
  author?: string;
  /** Thẻ chủ đề để lọc/tìm kiếm ở trang thư viện, vd ["AI", "Kỹ năng viết"]. */
  tags?: string[];
  /** Ngày xuất bản/hoàn thành tài liệu nguồn, định dạng "YYYY-MM-DD". */
  publishedAt?: string;
  /** Link chia sẻ Google Drive tới file gốc (dạng .../file/d/<id>/view...), để nhúng xem song song bản gốc. */
  sourceUrl?: string;
  /** id của CategoryDomain (lib/categories.ts) mà sách thuộc về, để lọc theo panel chủ đề ở trang chủ. */
  domain?: string;
  /** id của CategoryField (lib/categories.ts) trong domain trên. */
  field?: string;
  /** Ảnh thumbnail cho bài viết trên trang chủ — đường dẫn cục bộ (file đặt trong public/thumbnails/, ví dụ "/thumbnails/ten-file.jpg") hoặc một link ảnh public bất kỳ. Bỏ trống thì hiển thị ảnh mặc định theo tông màu của portal. */
  thumbnail?: string;
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
