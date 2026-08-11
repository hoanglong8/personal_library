export type SectionType =
  | "concept"
  | "framework"
  | "case-study"
  | "exercise"
  | "note"
  | "image";

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

export interface ImageSection extends BaseSection {
  type: "image";
  /** URL công khai của ảnh — dán link có sẵn, hoặc link lấy từ trang /chen-anh sau khi tải ảnh lên. */
  url: string;
  alt: string;
  caption?: string;
}

export type Section =
  | ConceptSection
  | FrameworkSection
  | CaseStudySection
  | ExerciseSection
  | NoteSection
  | ImageSection;

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
  /** Mã ngôn ngữ của bản này, vd "vi", "en" — dùng để LanguageSwitcher hiện đúng nhãn. Bỏ trống nghĩa là chưa xác định (coi như "vi", vì đó là ngôn ngữ mặc định của portal hiện tại). */
  lang?: string;
  /** id chung giữa các bản dịch của cùng 1 sách gốc — LanguageSwitcher tra các sách khác trong portal.json có cùng translationGroup để hiện link chuyển ngôn ngữ. Quy ước: đặt bằng slug của bản gốc. */
  translationGroup?: string;
  /** id file Google Drive nguồn (chỉ có ở sách tạo từ job "ingest") — dùng để job ingest sau này biết file này đã được xử lý rồi, không tạo bản nháp trùng cho cùng 1 tài liệu. */
  driveFileId?: string;
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
