"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Book } from "@/lib/types";

interface Edition {
  slug: string;
  lang: string;
  title: string;
}

const LANG_LABEL: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "English",
  es: "Español",
  ja: "日本語",
  ko: "한국어",
  zh: "中文",
  ar: "العربية",
  ru: "Русский",
  tr: "Türkçe",
};

// A translate AI job (lib/aiJobs/translate.ts) stamps the new edition's
// meta.translationGroup with the ORIGINAL book's slug — the original
// itself never gets a translationGroup of its own. So "the group this book
// belongs to" is `translationGroup ?? own slug`, and finding siblings from
// any edition (including the original) means matching every published
// book whose own `translationGroup ?? slug` equals that same key.
export default function LanguageSwitcher({
  bookSlug,
  translationGroup,
  currentModuleId,
}: {
  bookSlug: string;
  translationGroup?: string;
  currentModuleId?: string;
}) {
  const [editions, setEditions] = useState<Edition[]>([]);
  const groupKey = translationGroup ?? bookSlug;

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from("books")
      .select("slug, data")
      .eq("status", "published")
      .then(({ data }) => {
        if (!active || !data) return;
        const list: Edition[] = [];
        for (const row of data) {
          const b = row.data as Omit<Book, "slug">;
          const bGroup = b.meta.translationGroup ?? (row.slug as string);
          if (bGroup === groupKey) {
            list.push({ slug: row.slug as string, lang: b.meta.lang ?? "vi", title: b.meta.title });
          }
        }
        setEditions(list);
      });
    return () => {
      active = false;
    };
  }, [groupKey]);

  // Always show at least the current edition (it's included in `editions`
  // via the self-match above) rather than hiding until a 2nd language
  // exists — the button itself signals "this book may have translations",
  // and it stops being a 1-item no-op the moment a translate job publishes
  // a sibling.
  if (editions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {editions.map((e) => (
        <Link
          key={e.slug}
          href={currentModuleId ? `/${e.slug}/modules/${currentModuleId}` : `/${e.slug}`}
          className={`rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
            e.slug === bookSlug
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-paper-400 hover:border-accent hover:text-accent"
          }`}
        >
          {LANG_LABEL[e.lang] ?? e.lang}
        </Link>
      ))}
    </div>
  );
}
