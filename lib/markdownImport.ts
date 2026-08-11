import type { Module, Section } from "./types";
import { slugify } from "./slugify";

// Deliberately not a full CommonMark parser — just enough structure to
// bring a .md draft (with inline images) into the book's section model:
// H1 -> module title, H2 -> a new concept section's title, ![alt](url)
// -> its own image section, everything else -> concept section body.
// Text and images on the same line/paragraph both survive (the image
// regex is matched globally over each H2 block's raw text, not line by
// line), so "some text ![alt](url) more text" doesn't lose the text.

interface TextPart {
  type: "text";
  value: string;
}
interface ImagePart {
  type: "image";
  alt: string;
  url: string;
}

function splitByImages(text: string): (TextPart | ImagePart)[] {
  const regex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const parts: (TextPart | ImagePart)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    parts.push({ type: "image", alt: match[1].trim(), url: match[2].trim() });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  return parts;
}

export function parseMarkdownToModule(markdown: string, fallbackTitle: string): Module {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");

  let title = fallbackTitle;
  let bodyStart = 0;
  const h1Match = lines[0]?.match(/^#\s+(.+)/);
  if (h1Match) {
    title = h1Match[1].trim();
    bodyStart = 1;
  }
  const body = lines.slice(bodyStart).join("\n");

  // Split the body into blocks at each "## heading" line, remembering
  // which heading (if any) precedes each block.
  const blockRegex = /^##\s+(.+)$/gm;
  const blocks: { heading: string | null; content: string }[] = [];
  let lastIndex = 0;
  let currentHeading: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(body)) !== null) {
    blocks.push({ heading: currentHeading, content: body.slice(lastIndex, m.index) });
    currentHeading = m[1].trim();
    lastIndex = blockRegex.lastIndex;
  }
  blocks.push({ heading: currentHeading, content: body.slice(lastIndex) });

  const sections: Section[] = [];
  let textCount = 0;
  let imageCount = 0;

  for (const block of blocks) {
    let headingUsed = false;
    for (const part of splitByImages(block.content)) {
      if (part.type === "text") {
        const trimmed = part.value.trim();
        if (!trimmed) continue;
        textCount += 1;
        const sectionTitle = !headingUsed && block.heading ? block.heading : `Đoạn ${textCount}`;
        headingUsed = true;
        sections.push({ id: `doan-${textCount}`, type: "concept", title: sectionTitle, body: trimmed });
      } else {
        imageCount += 1;
        sections.push({
          id: `anh-md-${imageCount}`,
          type: "image",
          title: "",
          url: part.url,
          alt: part.alt || "Hình minh hoạ",
        });
      }
    }
  }

  return {
    id: slugify(title) || `nhap-md-${Date.now()}`,
    title,
    summary: "",
    sections,
  };
}
