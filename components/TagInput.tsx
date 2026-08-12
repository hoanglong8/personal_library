"use client";

import { useEffect, useRef, useState } from "react";

export default function TagInput({
  tags,
  onChange,
  suggestions,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setQuery("");
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  const matches = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-1.5 focus-within:border-accent">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="hover:text-danger"
              aria-label={`Xoá tag ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(query);
            } else if (e.key === "Backspace" && !query && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          placeholder={tags.length === 0 ? "Tìm hoặc thêm tag..." : "Thêm tag..."}
          className="min-w-32 flex-1 bg-transparent py-0.5 text-sm outline-none"
        />
      </div>
      {open && query && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg">
          {matches.slice(0, 8).map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => addTag(m)}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent-soft hover:text-accent"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
