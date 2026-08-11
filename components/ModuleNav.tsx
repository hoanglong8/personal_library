"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Module } from "@/lib/types";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleNav({
  modules,
  activeId,
  bookSlug,
}: {
  modules: Module[];
  activeId: string;
  bookSlug: string;
}) {
  const session = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // Reset stale progress the moment the signed-in user or book changes,
  // done during render (React's documented pattern for this) rather than
  // via a setState call at the top of an effect — this component always
  // shows the module list regardless of auth state, so unlike
  // MarkReadButton/BookmarkButton there's no render-time gate that would
  // otherwise hide a stale value.
  const progressKey = session ? `${session.user.id}:${bookSlug}` : `anon:${bookSlug}`;
  const [loadedFor, setLoadedFor] = useState(progressKey);
  if (loadedFor !== progressKey) {
    setLoadedFor(progressKey);
    setCompleted(new Set());
  }

  useEffect(() => {
    if (!supabase || !session) return;
    let active = true;
    supabase
      .from("reading_progress")
      .select("module_id")
      .eq("user_id", session.user.id)
      .eq("book_id", bookSlug)
      .then(({ data }) => {
        if (active && data) setCompleted(new Set(data.map((r) => r.module_id)));
      });
    return () => {
      active = false;
    };
  }, [session, bookSlug]);

  return (
    <nav className="hidden lg:block sticky top-20 h-fit w-56 shrink-0 text-sm">
      <ul className="space-y-1 border-l border-border">
        {modules.map((m, i) => {
          const active = m.id === activeId;
          const done = completed.has(m.id);
          return (
            <li key={m.id}>
              <Link
                href={`/${bookSlug}/modules/${m.id}`}
                className={`-ml-px block border-l-2 py-1.5 pl-4 transition-colors ${
                  active
                    ? "border-accent text-accent font-medium"
                    : "border-transparent text-ink-soft hover:text-ink hover:border-border"
                }`}
              >
                {done ? "✓ " : `${String(i + 1).padStart(2, "0")}. `}
                {m.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
