"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function MarkReadButton({
  bookSlug,
  moduleId,
}: {
  bookSlug: string;
  moduleId: string;
}) {
  const session = useSession();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    // No reset-to-null on sign-out here: the component already returns the
    // "đăng nhập để..." message below before `done` is ever read once
    // `session` is falsy, so a stale value never actually renders.
    if (!supabase || !session) return;
    let active = true;
    supabase
      .from("reading_progress")
      .select("module_id")
      .eq("user_id", session.user.id)
      .eq("book_id", bookSlug)
      .eq("module_id", moduleId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setDone(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [session, bookSlug, moduleId]);

  if (!isSupabaseConfigured) return null;

  if (!session) {
    return (
      <p className="mt-14 border-t border-border pt-6 text-xs text-paper-400">
        Đăng nhập ở góc trên để lưu tiến độ đọc.
      </p>
    );
  }

  async function toggle() {
    if (!supabase || !session) return;
    if (done) {
      await supabase
        .from("reading_progress")
        .delete()
        .eq("user_id", session.user.id)
        .eq("book_id", bookSlug)
        .eq("module_id", moduleId);
      setDone(false);
    } else {
      await supabase
        .from("reading_progress")
        .insert({ user_id: session.user.id, book_id: bookSlug, module_id: moduleId });
      setDone(true);
    }
  }

  return (
    <div className="mt-14 border-t border-border pt-6">
      <button
        onClick={toggle}
        disabled={done === null}
        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
          done
            ? "border-accent text-accent"
            : "border-border text-ink-soft hover:border-accent hover:text-accent"
        }`}
      >
        {done ? "✓ Đã đọc" : "Đánh dấu đã đọc"}
      </button>
    </div>
  );
}
