import { generateStructured } from "@/lib/gemini";
import { extractFolderId, listDriveFolderFiles, exportGoogleDocText } from "@/lib/googleDrive";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";
import { slugify } from "@/lib/slugify";
import type { Book, Section } from "@/lib/types";
import type { AiJobOutcome } from "./types";

// Above this, truncate before sending to Gemini — a full book's worth of
// PDF/Doc text could otherwise blow past the model's context/cost budget
// unnoticed. ~80k chars ≈ roughly the middle of a typical context window
// after accounting for the prompt/schema (per the roadmap's own note).
const MAX_EXTRACT_CHARS = 80_000;

interface IngestSummary {
  title: string;
  subtitle: string;
  moduleTitle: string;
  moduleSummary: string;
  concept: string;
  tocIntro?: string;
  tocEntries?: string[];
  caseStudyTitle?: string;
  caseStudyBody?: string;
  noteTitle?: string;
  noteBody?: string;
  exercisePrompt: string;
  exerciseHint?: string;
}

async function nextAvailableSlug(base: string): Promise<string> {
  const supabase = getAdminSupabase();
  let candidate = base;
  let suffix = 2;
  for (;;) {
    const { data } = await supabase.from("books").select("slug").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// Every Drive file that has ever become a book row (draft, reviewed,
// published — regardless of current state) counts as "already ingested".
// Rejecting a draft deletes its row, which does make that file eligible
// for re-ingest again — treated as intentional: a reject means "this
// attempt wasn't wanted", not "never touch this file again".
async function getAlreadyIngestedFileIds(): Promise<Set<string>> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("books").select("data").eq("source", "ingested");
  if (error) throw new Error(`Không đọc được danh sách sách đã ingest: ${error.message}`);
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const fileId = (row.data as Omit<Book, "slug">)?.meta?.driveFileId;
    if (fileId) ids.add(fileId);
  }
  return ids;
}

export async function runIngestJob(payload: { driveFolderUrl?: string }): Promise<AiJobOutcome> {
  const folderUrl = payload.driveFolderUrl || process.env.GOOGLE_DRIVE_INGEST_FOLDER_URL;
  if (!folderUrl) {
    throw new Error("Thiếu driveFolderUrl (payload hoặc GOOGLE_DRIVE_INGEST_FOLDER_URL).");
  }

  const folderId = extractFolderId(folderUrl);
  const files = await listDriveFolderFiles(folderId);

  const docFiles = files.filter((f) => f.mimeType === "application/vnd.google-apps.document");
  const skipped = files.filter((f) => f.mimeType !== "application/vnd.google-apps.document");
  if (docFiles.length === 0) {
    const skippedNote =
      skipped.length > 0
        ? ` (${skipped.length} file bị bỏ qua vì không phải Google Docs: ${skipped
            .map((f) => `${f.name} [${f.mimeType}]`)
            .join(", ")})`
        : "";
    throw new Error(`Không có Google Doc nào trong folder để xử lý.${skippedNote}`);
  }

  const alreadyIngested = await getAlreadyIngestedFileIds();
  const newDocFiles = docFiles.filter((f) => !alreadyIngested.has(f.id));
  if (newDocFiles.length === 0) {
    throw new Error(
      `Cả ${docFiles.length} Google Doc trong folder đều đã được ingest trước đó (đang ở dạng ` +
        `draft/reviewed/published) — không có tài liệu mới để xử lý.`
    );
  }

  // Still one file per job run — but now the FIRST NOT-YET-INGESTED file,
  // not just docFiles[0], so re-running this job works through the folder
  // one new document at a time instead of re-processing the same file
  // (which previously created a duplicate draft on every run).
  const file = newDocFiles[0];
  let text = await exportGoogleDocText(file.id);
  let truncated = false;
  if (text.length > MAX_EXTRACT_CHARS) {
    text = text.slice(0, MAX_EXTRACT_CHARS);
    truncated = true;
  }

  const summary = await generateStructured<IngestSummary>({
    prompt: [
      "Đọc văn bản trích từ 1 tài liệu nguồn dưới đây và tóm tắt thành 1",
      "module giới thiệu cho một portal đọc sách. Bám sát nội dung thật,",
      "KHÔNG bịa case study/số liệu không có trong văn bản — nếu văn bản",
      "không có case study thật thì để trống caseStudyTitle/caseStudyBody;",
      "nếu không có định nghĩa/lưu ý đáng chú ý thì để trống noteTitle/",
      "noteBody.",
      "",
      "Về tocEntries: đây PHẢI là mục lục THẬT của tài liệu gốc, trích gần",
      "đúng nguyên văn từ phần \"Mục lục\"/\"Contents\" nếu văn bản có (mỗi",
      "phần tử là 1 dòng mục lục, giữ đúng thứ tự xuất hiện, có thể giữ số",
      "trang nếu có). TUYỆT ĐỐI KHÔNG tự đặt ra một mục lục hay quy trình",
      "không có trong tài liệu — nếu đoạn văn bản trích không chứa mục lục",
      "thật (ví dụ vì đoạn trích chỉ là 1 phần giữa sách), để trống",
      "tocIntro/tocEntries.",
      "",
      "exercisePrompt là phần được phép tự soạn thêm (1 câu hỏi gợi người",
      "đọc suy ngẫm/áp dụng), bám sát nội dung concept.",
      "",
      `Tên file gốc: ${file.name}`,
      "",
      "Văn bản:",
      text,
    ].join("\n"),
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        moduleTitle: { type: "string" },
        moduleSummary: { type: "string" },
        concept: { type: "string" },
        tocIntro: { type: "string" },
        tocEntries: { type: "array", items: { type: "string" } },
        caseStudyTitle: { type: "string" },
        caseStudyBody: { type: "string" },
        noteTitle: { type: "string" },
        noteBody: { type: "string" },
        exercisePrompt: { type: "string" },
        exerciseHint: { type: "string" },
      },
      required: ["title", "subtitle", "moduleTitle", "moduleSummary", "concept", "exercisePrompt"],
    },
  });

  const sections: Section[] = [
    { id: "khai-niem", type: "concept", title: "Tổng quan", body: summary.concept },
  ];
  if (summary.tocEntries && summary.tocEntries.length > 0) {
    sections.push({
      id: "muc-luc",
      type: "framework",
      title: "Mục lục tài liệu gốc",
      intro: summary.tocIntro,
      steps: summary.tocEntries,
    });
  }
  if (summary.caseStudyBody) {
    sections.push({
      id: "tinh-huong",
      type: "case-study",
      title: summary.caseStudyTitle || "Tình huống thực tế",
      body: summary.caseStudyBody,
      source: file.name,
    });
  }
  if (summary.noteBody) {
    sections.push({
      id: "luu-y",
      type: "note",
      title: summary.noteTitle || "Lưu ý",
      body: summary.noteBody,
      variant: "tip",
    });
  }
  sections.push({
    id: "bai-tap",
    type: "exercise",
    title: "Bài tập gợi suy ngẫm",
    prompt: summary.exercisePrompt,
    hint: summary.exerciseHint,
  });

  const baseSlug = slugify(summary.title) || slugify(file.name) || "tai-lieu-moi";
  const slug = await nextAvailableSlug(baseSlug);

  const data: Omit<Book, "slug"> = {
    meta: {
      title: summary.title,
      subtitle: summary.subtitle,
      sourceLabel: "Ingest từ Google Drive",
      disclaimer: truncated
        ? "Bản tóm tắt do AI tạo từ tài liệu Google Drive (văn bản gốc dài, đã cắt bớt trước khi tóm tắt) — chưa được người biên soạn xác nhận."
        : "Bản tóm tắt do AI tạo từ tài liệu Google Drive — chưa được người biên soạn xác nhận.",
      stats: [{ label: "chương", value: "1" }],
      // Same URL shape lib/drive.ts::toDriveEmbedUrl already parses (it
      // only recognizes /file/d/<id>/..., not the docs.google.com/document
      // path a Doc's own webViewLink would use) — this turns on the
      // existing "Xem bản gốc" viewer for free, no new code needed there.
      sourceUrl: `https://drive.google.com/file/d/${file.id}/view`,
      driveFileId: file.id,
    },
    modules: [
      {
        id: "tong-quan",
        title: summary.moduleTitle,
        summary: summary.moduleSummary,
        sections,
      },
    ],
  };

  return { kind: "new-draft", slug, data };
}
