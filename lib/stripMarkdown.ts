// For preview contexts that need plain, single-line-friendly text (card
// blurbs cut off with line-clamp) where rendering actual markdown block
// elements (tables, headings, lists) would break the layout — strips the
// common markdown syntax instead of parsing it, so "**bold**" reads as
// "bold" rather than showing the asterisks.
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*\*|___)(.*?)\1/g, "$2")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, "")
    .replace(/^\|.*\|$/gm, (row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean)
        .join(" · ")
    )
    .replace(/^-{3,}$/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
