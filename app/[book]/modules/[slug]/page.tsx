import Link from "next/link";
import { notFound } from "next/navigation";
import ModuleNav from "@/components/ModuleNav";
import SectionToc from "@/components/SectionToc";
import ModuleSearch from "@/components/ModuleSearch";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SectionRenderer from "@/components/SectionRenderer";
import MarkReadButton from "@/components/MarkReadButton";
import { getBook, getModule, getAdjacentModules } from "@/lib/content";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ book: string; slug: string }>;
}) {
  const { book: bookSlug, slug } = await params;
  const [book, mod] = await Promise.all([getBook(bookSlug), getModule(bookSlug, slug)]);
  if (!book || !mod) notFound();

  const { prev, next } = await getAdjacentModules(bookSlug, slug);

  return (
    <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <ModuleSearch sections={mod.sections} />
        <LanguageSwitcher
          bookSlug={bookSlug}
          translationGroup={book.meta.translationGroup}
          currentModuleId={slug}
        />
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        <ModuleNav modules={book.modules} activeId={slug} bookSlug={bookSlug} />

        <article className="mx-auto min-w-0 max-w-3xl flex-1">
          <h1 className="text-3xl font-semibold text-ink">{mod.title}</h1>
          <p className="mt-2 text-ink-soft">{mod.summary}</p>

          <div className="mt-10 space-y-10">
            {mod.sections.map((section) => (
              <SectionRenderer key={section.id} section={section} bookSlug={bookSlug} />
            ))}
          </div>

          <MarkReadButton bookSlug={bookSlug} moduleId={slug} />

          <div className="mt-6 flex items-center justify-between border-t border-border pt-6 text-sm">
            {prev ? (
              <Link href={`/${bookSlug}/modules/${prev.id}`} className="text-accent hover:underline">
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/${bookSlug}/modules/${next.id}`} className="text-accent hover:underline">
                {next.title} →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </article>

        <SectionToc sections={mod.sections} />
      </div>
    </div>
  );
}
