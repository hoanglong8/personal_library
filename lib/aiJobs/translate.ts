import type { Book, Module, Section } from "@/lib/types";
import { generateStructured } from "@/lib/gemini";
import type { AiJobOutcome } from "./types";

interface TranslatedSection {
  id: string;
  title?: string;
  body?: string;
  intro?: string;
  steps?: string[];
  prompt?: string;
  hint?: string;
  answer?: string;
  alt?: string;
  caption?: string;
}

interface TranslatedModule {
  moduleTitle: string;
  moduleSummary: string;
  sections: TranslatedSection[];
}

const SECTION_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    body: { type: "string" },
    intro: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
    prompt: { type: "string" },
    hint: { type: "string" },
    answer: { type: "string" },
    alt: { type: "string" },
    caption: { type: "string" },
  },
  required: ["id"],
};

function sectionToTranslatableFields(section: Section) {
  return {
    id: section.id,
    type: section.type,
    title: section.title,
    body: "body" in section ? section.body : undefined,
    intro: section.type === "framework" ? section.intro : undefined,
    steps: section.type === "framework" ? section.steps : undefined,
    prompt: section.type === "exercise" ? section.prompt : undefined,
    hint: section.type === "exercise" ? section.hint : undefined,
    answer: section.type === "exercise" ? section.answer : undefined,
    alt: section.type === "image" ? section.alt : undefined,
    caption: section.type === "image" ? section.caption : undefined,
  };
}

// Reconstructs a section of the SAME type/shape as the original, only
// swapping in translated text — non-text fields (type, variant, url,
// source, exercise/case-study id) are copied verbatim so translation can
// never accidentally change a section's structure.
function applyTranslation(original: Section, t: TranslatedSection | undefined): Section {
  if (!t) return original;
  const title = t.title ?? original.title;

  switch (original.type) {
    case "concept":
      return { ...original, title, body: t.body ?? original.body };
    case "framework":
      return {
        ...original,
        title,
        intro: t.intro ?? original.intro,
        steps: t.steps && t.steps.length > 0 ? t.steps : original.steps,
      };
    case "case-study":
      return { ...original, title, body: t.body ?? original.body };
    case "exercise":
      return {
        ...original,
        title,
        prompt: t.prompt ?? original.prompt,
        hint: t.hint ?? original.hint,
        answer: t.answer ?? original.answer,
      };
    case "note":
      return { ...original, title, body: t.body ?? original.body };
    case "image":
      return { ...original, title, alt: t.alt ?? original.alt, caption: t.caption ?? original.caption };
  }
}

async function translateModule(mod: Module, targetLang: string): Promise<Module> {
  const payload = {
    moduleTitle: mod.title,
    moduleSummary: mod.summary,
    sections: mod.sections.map(sectionToTranslatableFields),
  };

  const translated = await generateStructured<TranslatedModule>({
    prompt: [
      `Dịch nội dung sau sang ngôn ngữ có mã "${targetLang}" (mã ISO 639-1,`,
      'vd "en" = tiếng Anh, "es" = tiếng Tây Ban Nha). Giữ nguyên field "id"',
      "của từng section không đổi. Chỉ dịch các field text (title, body,",
      "intro, steps, prompt, hint, answer, alt, caption) có giá trị khác",
      "null trong dữ liệu gốc — field nào null/không có trong gốc thì bỏ",
      "qua, không tự bịa thêm nội dung. Giữ đúng nghĩa, văn phong tự nhiên",
      "trong ngôn ngữ đích, không dịch máy móc từng từ.",
      "",
      "Dữ liệu gốc (JSON):",
      JSON.stringify(payload, null, 2),
    ].join("\n"),
    schema: {
      type: "object",
      properties: {
        moduleTitle: { type: "string" },
        moduleSummary: { type: "string" },
        sections: { type: "array", items: SECTION_SCHEMA },
      },
      required: ["moduleTitle", "moduleSummary", "sections"],
    },
  });

  const bySectionId = new Map(translated.sections.map((s) => [s.id, s]));

  return {
    ...mod,
    title: translated.moduleTitle || mod.title,
    summary: translated.moduleSummary || mod.summary,
    sections: mod.sections.map((s) => applyTranslation(s, bySectionId.get(s.id))),
  };
}

export async function runTranslateJob(
  book: Book,
  payload: { targetLang?: string }
): Promise<AiJobOutcome> {
  const targetLang = payload.targetLang?.trim();
  if (!targetLang) {
    throw new Error("Thiếu targetLang trong payload của job translate.");
  }

  const newSlug = `${book.slug}-${targetLang}`;

  const { title, subtitle } = await generateStructured<{ title: string; subtitle: string }>({
    prompt: [
      `Dịch tiêu đề và mô tả sau sang ngôn ngữ mã "${targetLang}":`,
      `Tiêu đề: ${book.meta.title}`,
      `Mô tả: ${book.meta.subtitle}`,
    ].join("\n"),
    schema: {
      type: "object",
      properties: { title: { type: "string" }, subtitle: { type: "string" } },
      required: ["title", "subtitle"],
    },
  });

  // Sequential, not Promise.all — a full book can have 10-20 modules and
  // running them concurrently risks the Gemini free-tier per-minute rate
  // limit; sequential is slower but reliable for a first implementation.
  const modules: Module[] = [];
  for (const mod of book.modules) {
    modules.push(await translateModule(mod, targetLang));
  }

  const data: Omit<Book, "slug"> = {
    meta: {
      ...book.meta,
      title,
      subtitle,
      lang: targetLang,
      translationGroup: book.meta.translationGroup ?? book.slug,
      disclaimer: "Bản dịch bằng AI, chưa được người biên soạn gốc xác nhận.",
    },
    modules,
  };

  return { kind: "new-draft", slug: newSlug, data };
}
