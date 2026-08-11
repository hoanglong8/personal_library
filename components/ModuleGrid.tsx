"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Module } from "@/lib/types";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleGrid({
  modules,
  bookSlug,
}: {
  modules: Module[];
  bookSlug: string;
}) {
  const session = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  // See ModuleNav.tsx for why this resets during render instead of via a
  // setState call at the top of an effect.
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
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="text-sm font-mono uppercase tracking-widest text-paper-400">
        Mục lục
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {modules.map((m, i) => {
          const done = completed.has(m.id);
          return (
            <Link
              key={m.id}
              href={`/${bookSlug}/modules/${m.id}`}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <span className="font-mono text-xs text-accent">
                {done ? "✓" : String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-medium text-ink group-hover:text-accent transition-colors">
                {m.title}
              </h3>
              <p className="mt-1.5 text-sm text-ink-soft line-clamp-2">
                {m.summary}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
