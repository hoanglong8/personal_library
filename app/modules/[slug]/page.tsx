import Link from "next/link";
import { notFound } from "next/navigation";
import ModuleNav from "@/components/ModuleNav";
import SectionRenderer from "@/components/SectionRenderer";
import { getPortal, getModule, getModuleSlugs, getAdjacentModules } from "@/lib/content";

export function generateStaticParams() {
  return getModuleSlugs().map((slug) => ({ slug }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const { modules } = getPortal();
  const { prev, next } = getAdjacentModules(slug);

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-6 py-10">
      <ModuleNav modules={modules} activeId={slug} />

      <article className="min-w-0 flex-1">
        <h1 className="text-3xl font-semibold text-ink">{mod.title}</h1>
        <p className="mt-2 text-ink-soft">{mod.summary}</p>

        <div className="mt-10 space-y-10">
          {mod.sections.map((section) => (
            <SectionRenderer key={section.id} section={section} />
          ))}
        </div>

        <div className="mt-14 flex items-center justify-between border-t border-border pt-6 text-sm">
          {prev ? (
            <Link href={`/modules/${prev.id}`} className="text-accent hover:underline">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/modules/${next.id}`} className="text-accent hover:underline">
              {next.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </article>
    </div>
  );
}
