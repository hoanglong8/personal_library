"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Module } from "@/lib/types";
import { useSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// Reading progress + the "download" entry point (currently a print-to-PDF
// route, see app/[book]/print). Gated behind login per product requirement
// ("người đọc phải đăng nhập mới thấy link tải") — worth noting the gate is
// a signup nudge, not real DRM: the same content is already fully public
// via the normal /modules/[slug] pages regardless of session.
export default function HeroActions({
  bookSlug,
  modules,
}: {
  bookSlug: string;
  modules: Module[];
}) {
  const session = useSession();
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    // No reset-to-null on sign-out: the JSX below only reads
    // `completedCount` inside a `session && ...` guard, so a stale value
    // never actually renders once `session` is falsy.
    if (!supabase || !session) return;
    let active = true;
    supabase
      .from("reading_progress")
      .select("module_id", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("book_id", bookSlug)
      .then(({ count }) => {
        if (active) setCompletedCount(count ?? 0);
      });
    return () => {
      active = false;
    };
  }, [session, bookSlug]);

  if (!isSupabaseConfigured) return null;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-4">
      {session && completedCount !== null && (
        <p className="text-sm font-mono text-paper-400">
          <span className="text-ink">
            {completedCount}/{modules.length}
          </span>{" "}
          chương đã đọc
        </p>
      )}

      {session ? (
        <Link
          href={`/${bookSlug}/print`}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          🖨️ Tải PDF
        </Link>
      ) : (
        <p className="text-xs text-paper-400">Đăng nhập ở góc trên để tải sách.</p>
      )}
    </div>
  );
}
