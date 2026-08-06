"use client";

import { useState } from "react";

export default function OriginalSourceViewer({
  embedUrl,
  originalUrl,
  bookTitle,
  children,
}: {
  embedUrl: string;
  originalUrl: string;
  bookTitle: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:flex lg:items-start">
      <div className={open ? "min-w-0 lg:w-3/5" : "w-full"}>{children}</div>

      {open && (
        <aside className="border-t border-border lg:sticky lg:top-14 lg:h-[calc(100vh-56px)] lg:w-2/5 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-border bg-surface px-3 py-2">
            <span className="truncate font-mono text-xs uppercase tracking-widest text-paper-400">
              Bản gốc — {bookTitle}
            </span>
            <div className="flex shrink-0 items-center gap-3">
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:underline"
              >
                Mở tab mới ↗
              </a>
              <button
                onClick={() => setOpen(false)}
                aria-label="Đóng bản gốc"
                className="text-paper-400 hover:text-ink"
              >
                ✕
              </button>
            </div>
          </div>
          <iframe
            src={embedUrl}
            title={`Bản gốc — ${bookTitle}`}
            className="h-[70vh] w-full lg:h-[calc(100%-37px)]"
            allow="autoplay"
          />
        </aside>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-20 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink shadow-lg hover:opacity-90"
        >
          📄 Xem bản gốc
        </button>
      )}
    </div>
  );
}
