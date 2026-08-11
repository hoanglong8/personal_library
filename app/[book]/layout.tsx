import { notFound } from "next/navigation";
import { getBook } from "@/lib/content";
import { toDriveEmbedUrl } from "@/lib/drive";
import OriginalSourceViewer from "@/components/OriginalSourceViewer";

export default async function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ book: string }>;
}) {
  const { book: bookSlug } = await params;
  const book = await getBook(bookSlug);
  if (!book) notFound();

  const embedUrl = book.meta.sourceUrl ? toDriveEmbedUrl(book.meta.sourceUrl) : null;

  if (!embedUrl || !book.meta.sourceUrl) {
    return <>{children}</>;
  }

  return (
    <OriginalSourceViewer
      embedUrl={embedUrl}
      originalUrl={book.meta.sourceUrl}
      bookTitle={book.meta.title}
    >
      {children}
    </OriginalSourceViewer>
  );
}
