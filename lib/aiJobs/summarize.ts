import type { Book } from "@/lib/types";
import { generateStructured } from "@/lib/gemini";
import type { AiJobOutcome } from "./types";

export async function runSummarizeJob(book: Book): Promise<AiJobOutcome> {
  const context = [
    `Tiêu đề: ${book.meta.title}`,
    `Mô tả hiện tại: ${book.meta.subtitle}`,
    ...book.modules.map((m, i) => `Chương ${i + 1} — ${m.title}: ${m.summary}`),
  ].join("\n");

  const { subtitle } = await generateStructured<{ subtitle: string }>({
    prompt: [
      "Viết lại phần mô tả ngắn (1-2 câu, tiếng Việt) cho một cuốn sách, dựa",
      "trên tiêu đề và tóm tắt từng chương dưới đây. Bám sát nội dung thật,",
      "không thêm chi tiết không có trong tóm tắt các chương.",
      "",
      context,
    ].join("\n"),
    schema: {
      type: "object",
      properties: { subtitle: { type: "string" } },
      required: ["subtitle"],
    },
  });

  const { slug, ...data } = book;
  return {
    kind: "pending-edit",
    slug,
    data: { ...data, meta: { ...data.meta, subtitle } },
  };
}
