"use client";

import type { ReactNode } from "react";

// Soft deterrent against casual copy/paste while reading — NOT real DRM:
// view-source, devtools, and disabling JS all still expose the full text.
// Scoped tightly around actual book content (never wraps CommentThread or
// BookmarkButton) so writing/selecting text in the comment box still works
// normally.
export default function AntiCopyGuard({ children }: { children: ReactNode }) {
  return (
    <div
      className="select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
