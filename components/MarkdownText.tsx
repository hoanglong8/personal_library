import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Section bodies (concept/case-study/note/exercise/framework) are authored
// through MarkdownFieldEditor (components/MarkdownFieldEditor.tsx) — real
// markdown, not plain text. This is the reader-side counterpart that
// actually parses it, instead of dumping the raw string (which used to
// leak syntax like "**" or "| a | b |" straight onto the page). No "use
// client" needed — the synchronous <ReactMarkdown> component doesn't use
// hooks/browser APIs, so it renders fine on the server.
export default function MarkdownText({ text }: { text: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
}
