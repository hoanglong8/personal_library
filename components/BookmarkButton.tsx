"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

export default function BookmarkButton({
  bookSlug,
  sectionId,
}: {
  bookSlug: string;
  sectionId: string;
}) {
  const session = useSession();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // No reset-to-false on sign-out: the component returns null below once
    // `session` is falsy, so a stale `saved` value never actually renders.
    if (!supabase || !session) return;
    let active = true;
    supabase
      .from("bookmarks")
      .select("section_id")
      .eq("user_id", session.user.id)
      .eq("book_id", bookSlug)
      .eq("section_id", sectionId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSaved(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [session, bookSlug, sectionId]);

  // Hidden entirely when signed out, rather than shown-disabled — bookmarks
  // are a personal reading-list feature, not something worth prompting an
  // anonymous visitor about on every single section.
  if (!session) return null;

  async function toggle() {
    if (!supabase || !session) return;
    if (saved) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", session.user.id)
        .eq("book_id", bookSlug)
        .eq("section_id", sectionId);
      setSaved(false);
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: session.user.id, book_id: bookSlug, section_id: sectionId });
      setSaved(true);
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={saved ? "Bỏ đánh dấu mục này" : "Đánh dấu mục này vào tuyển tập"}
      className={`text-xs transition-colors ${
        saved ? "text-accent" : "text-paper-400 hover:text-accent"
      }`}
    >
      {saved ? "★ Đã lưu" : "☆ Lưu vào tuyển tập"}
    </button>
  );
}
