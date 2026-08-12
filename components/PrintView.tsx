"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Book, Section, NoteSection } from "@/lib/types";
import MarkdownText from "./MarkdownText";

const NOTE_LABEL: Record<NoteSection["variant"], string> = {
  tip: "Ghi chú",
  warning: "Lưu ý",
  definition: "Định nghĩa",
};

function SectionPrintBlock({ section }: { section: Section }) {
  return (
    <div className="mt-6">
      <h4 className="text-base font-medium text-ink">{section.title}</h4>

      {section.type === "concept" && (
        <div className="prose-portal mt-2">
          <MarkdownText text={section.body} />
        </div>
      )}

      {section.type === "case-study" && (
        <>
          <div className="prose-portal mt-2">
            <MarkdownText text={section.body} />
          </div>
          {section.source && (
            <p className="mt-1 text-sm text-paper-400">Nguồn: {section.source}</p>
          )}
        </>
      )}

      {section.type === "framework" && (
        <>
          {section.intro && (
            <div className="prose-portal mt-2">
              <MarkdownText text={section.intro} />
            </div>
          )}
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-ink-soft">
            {section.steps.map((step, i) => (
              <li key={i} className="prose-portal [&_p]:mb-0">
                <MarkdownText text={step} />
              </li>
            ))}
          </ol>
        </>
      )}

      {section.type === "exercise" && (
        <>
          <div className="prose-portal mt-2">
            <MarkdownText text={section.prompt} />
          </div>
          {section.hint && (
            <div className="mt-1 text-sm">
              <p className="font-medium text-ink">Gợi ý:</p>
              <div className="prose-portal">
                <MarkdownText text={section.hint} />
              </div>
            </div>
          )}
          {section.answer && (
            <div className="mt-1 text-sm">
              <p className="font-medium text-ink">Đáp án tham khảo:</p>
              <div className="prose-portal">
                <MarkdownText text={section.answer} />
              </div>
            </div>
          )}
        </>
      )}

      {section.type === "note" && (
        <div className="mt-2 text-ink-soft">
          <p className="font-medium text-ink">{NOTE_LABEL[section.variant]}:</p>
          <div className="prose-portal">
            <MarkdownText text={section.body} />
          </div>
        </div>
      )}

      {section.type === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={section.url} alt={section.alt} className="mt-2 max-w-full rounded" />
      )}
      {section.type === "image" && section.caption && (
        <p className="mt-1 text-sm text-paper-400">{section.caption}</p>
      )}
    </div>
  );
}

export default function PrintView({ bookSlug }: { bookSlug: string }) {
  const session = useSession();
  // undefined = not fetched yet, null = fetched but not found
  const [book, setBook] = useState<Book | null | undefined>(undefined);

  useEffect(() => {
    // No reset-to-undefined on sign-out: the component returns the
    // "đăng nhập để..." message below before `book` is ever read once
    // `session` is falsy, so stale content never actually renders.
    if (!supabase || !session) return;
    let active = true;
    supabase
      .from("books")
      .select("slug, data")
      .eq("slug", bookSlug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (!data) {
          setBook(null);
          return;
        }
        setBook({ slug: data.slug, ...(data.data as Omit<Book, "slug">) });
      });
    return () => {
      active = false;
    };
  }, [session, bookSlug]);

  if (!isSupabaseConfigured) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-14 text-sm text-paper-400">
        Tính năng chưa được kích hoạt.
      </p>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-14 text-center">
        <p className="text-sm text-paper-400">
          Đăng nhập ở góc trên để tải bản in của sách này.
        </p>
      </div>
    );
  }

  if (book === undefined) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-14 text-sm text-paper-400">Đang tải...</p>
    );
  }

  if (book === null) {
    return (
      <p className="mx-auto max-w-3xl px-6 py-14 text-sm text-paper-400">
        Không tìm thấy sách này.
      </p>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-8 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-ink"
        >
          🖨️ In / Lưu thành PDF
        </button>
      </div>

      <h1 className="text-3xl font-semibold text-ink">{book.meta.title}</h1>
      <p className="mt-2 text-ink-soft">{book.meta.subtitle}</p>

      {book.modules.map((mod) => (
        <section key={mod.id} className="mt-12" style={{ breakBefore: "page" }}>
          <h2 className="text-2xl font-semibold text-ink">{mod.title}</h2>
          <div className="prose-portal mt-1">
            <MarkdownText text={mod.summary} />
          </div>
          {mod.sections.map((section) => (
            <SectionPrintBlock key={section.id} section={section} />
          ))}
        </section>
      ))}
    </article>
  );
}
