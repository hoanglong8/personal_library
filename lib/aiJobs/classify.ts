import type { Book } from "@/lib/types";
import { CATEGORY_TREE } from "@/lib/categories";
import { generateStructured } from "@/lib/gemini";
import type { AiJobOutcome } from "./types";

export async function runClassifyJob(book: Book): Promise<AiJobOutcome> {
  const domainIds = CATEGORY_TREE.map((d) => d.id);
  const fieldIds = CATEGORY_TREE.flatMap((d) => d.fields.map((f) => f.id));

  const treeDescription = CATEGORY_TREE.map(
    (d) => `- ${d.id} (${d.label}): ${d.fields.map((f) => `${f.id} (${f.label})`).join(", ")}`
  ).join("\n");

  const context = [
    `Tiêu đề: ${book.meta.title}`,
    `Mô tả: ${book.meta.subtitle}`,
    ...book.modules.map((m, i) => `Chương ${i + 1} — ${m.title}: ${m.summary}`),
  ].join("\n");

  const { domain, field } = await generateStructured<{ domain: string; field: string }>({
    prompt: [
      "Xếp một cuốn sách vào đúng 1 domain và 1 field trong cây chủ đề dưới",
      "đây (chỉ được chọn id có sẵn, không tự đặt domain/field mới):",
      "",
      treeDescription,
      "",
      "Nội dung sách:",
      context,
    ].join("\n"),
    schema: {
      type: "object",
      properties: {
        domain: { type: "string", enum: domainIds },
        field: { type: "string", enum: fieldIds },
      },
      required: ["domain", "field"],
    },
  });

  // Gemini's schema can only enumerate `field` against the FLAT list of all
  // field ids across every domain — it has no way to express "field must
  // belong to the chosen domain" as a schema constraint. Re-validate that
  // relationship in code before writing anything, per the roadmap's rule:
  // never silently "fix" an AI's classification, error out instead.
  const domainEntry = CATEGORY_TREE.find((d) => d.id === domain);
  const fieldValid = domainEntry?.fields.some((f) => f.id === field);
  if (!domainEntry || !fieldValid) {
    throw new Error(
      `Gemini trả về domain="${domain}" field="${field}" không khớp cây chủ đề — không ghi.`
    );
  }

  const { slug, ...data } = book;
  return {
    kind: "pending-edit",
    slug,
    data: { ...data, meta: { ...data.meta, domain, field } },
  };
}
