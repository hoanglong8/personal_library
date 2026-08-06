import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import ModuleGrid from "@/components/ModuleGrid";
import { getBook, getBookSlugs } from "@/lib/content";

export function generateStaticParams() {
  return getBookSlugs().map((book) => ({ book }));
}

export default async function BookHomePage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book: bookSlug } = await params;
  const book = getBook(bookSlug);
  if (!book) notFound();

  return (
    <>
      <Hero meta={book.meta} firstModule={book.modules[0]} bookSlug={bookSlug} />
      <ModuleGrid modules={book.modules} bookSlug={bookSlug} />
    </>
  );
}
