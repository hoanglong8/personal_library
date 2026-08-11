"use client";

import { useState } from "react";
import type { Section } from "@/lib/types";

// Searches the sections of the CURRENT module only (title + body-ish text
// per section type) and lets the reader jump to a match via its existing
// #section-id anchor — deliberately not a raw-DOM text highlighter (that
// would fight React's own reconciliation of the same nodes); matching
// against the structured section data we already have is simpler and safe.
function sectionText(s: Section): string {
  const parts: string[] = [s.title];
  if ("body" in s) parts.push(s.body);
  if (s.type === "framework") {
    if (s.intro) parts.push(s.intro);
    parts.push(...s.steps);
  }
  if (s.type === "exercise") {
    parts.push(s.prompt);
    if (s.hint) parts.push(s.hint);
    if (s.answer) parts.push(s.answer);
  }
  if (s.type === "image" && s.caption) parts.push(s.caption);
  return parts.join(" ");
}

export default function ModuleSearch({ sections }: { sections: Section[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed ? sections.filter((s) => sectionText(s).toLowerCase().includes(trimmed)) : [];

  return (
    <div className="relative w-full max-w-xs">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="🔍 Tìm trong trang..."
        className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-xs outline-none focus:border-accent"
      />
      {open && trimmed && (
        <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {matches.length === 0 && (
            <li className="px-3 py-2 text-xs text-paper-400">Không tìm thấy.</li>
          )}
          {matches.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block px-3 py-2 text-xs hover:bg-accent-soft hover:text-accent">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
