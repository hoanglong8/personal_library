import { notFound } from "next/navigation";
import Hero from "@/components/Hero";
import ModuleGrid from "@/components/ModuleGrid";
import { getBook } from "@/lib/content";

export default async function BookHomePage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book: bookSlug } = await params;
  const book = await getBook(bookSlug);
  if (!book) notFound();

  return (
    <>
      <Hero meta={book.meta} modules={book.modules} firstModule={book.modules[0]} bookSlug={bookSlug} />
      <ModuleGrid modules={book.modules} bookSlug={bookSlug} />
    </>
  );
}
