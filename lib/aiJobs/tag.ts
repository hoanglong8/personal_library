import type { Book } from "@/lib/types";
import { generateStructured } from "@/lib/gemini";
import type { AiJobOutcome } from "./types";

export async function runTagJob(book: Book): Promise<AiJobOutcome> {
  const context = [
    `Tiêu đề: ${book.meta.title}`,
    `Mô tả: ${book.meta.subtitle}`,
    ...book.modules.map((m, i) => `Chương ${i + 1} — ${m.title}: ${m.summary}`),
  ].join("\n");

  const { tags } = await generateStructured<{ tags: string[] }>({
    prompt: [
      "Đọc nội dung một cuốn sách dưới đây (tiêu đề + mô tả từng chương) và",
      "đề xuất 3-6 thẻ chủ đề tiếng Việt ngắn gọn (2-4 từ mỗi thẻ), bám sát",
      "nội dung thật, dùng để lọc/tìm kiếm ở trang thư viện. Không bịa chủ đề",
      "không có trong nội dung.",
      "",
      context,
    ].join("\n"),
    schema: {
      type: "object",
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 6,
        },
      },
      required: ["tags"],
    },
  });

  const { slug, ...data } = book;
  return {
    kind: "pending-edit",
    slug,
    data: { ...data, meta: { ...data.meta, tags } },
  };
}
