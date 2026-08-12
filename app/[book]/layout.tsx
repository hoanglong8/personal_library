import { notFound } from "next/navigation";
import { getBook } from "@/lib/content";
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

  if (!book.meta.sourceUrl) {
    return <>{children}</>;
  }

  // Both point at our own proxy route (app/api/drive-proxy/[bookSlug]),
  // never the raw Drive URL — see that route for why.
  const proxyUrl = `/api/drive-proxy/${bookSlug}`;

  return (
    <OriginalSourceViewer embedUrl={proxyUrl} originalUrl={proxyUrl} bookTitle={book.meta.title}>
      {children}
    </OriginalSourceViewer>
  );
}
