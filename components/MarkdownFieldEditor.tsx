"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

// Loaded on demand — a full markdown editor + syntax highlighter isn't
// needed until an admin actually opens a book to edit, no reason to add
// it to every page's initial bundle.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

async function readFileAsText(file: File): Promise<string> {
  if (file.name.toLowerCase().endsWith(".docx")) {
    // extractRawText (not convertToHtml) on purpose — every field this
    // editor is used for (concept/case-study/note body, exercise prompt...)
    // is plain paragraph text in this app's model (rendered by splitting
    // on blank lines, see components/ConceptBlock.tsx), not rich HTML —
    // pulling in a 3rd dependency (turndown) to preserve .docx formatting
    // that the rest of the app can't render anyway would be pointless.
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  return file.text();
}

export default function MarkdownFieldEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  // Matches app/layout.tsx's inline script default ("dark" until
  // localStorage says otherwise) so the editor doesn't flash the wrong
  // theme on first paint.
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    const readTheme = () =>
      setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    readTheme();
    window.addEventListener("portal-theme-change", readTheme);
    return () => window.removeEventListener("portal-theme-change", readTheme);
  }, []);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError(null);
    try {
      const text = await readFileAsText(file);
      onChange(value.trim() ? `${value}\n\n${text.trim()}` : text.trim());
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Đọc file thất bại.");
    }
  }

  return (
    <div data-color-mode={theme}>
      <div className="mb-1 flex items-center justify-between">
        <label className="cursor-pointer text-xs text-accent hover:underline">
          📄 Tải file (.md, .txt, .docx) — nối vào cuối
          <input
            type="file"
            accept=".md,.txt,.docx,text/markdown,text/plain"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {fileError && <span className="text-xs text-danger">{fileError}</span>}
      </div>
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={minHeight}
        textareaProps={{ placeholder }}
      />
    </div>
  );
}
