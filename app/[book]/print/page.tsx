import PrintView from "@/components/PrintView";

// Server Component only to unwrap the route param the same way as its
// siblings (app/[book]/page.tsx, .../modules/[slug]/page.tsx) — it does
// NOT fetch book content itself. PrintView (client) fetches the book only
// after confirming a session, so an anonymous request to this URL never
// receives book content in the response at all, not even hidden by CSS.
export default async function PrintPage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book: bookSlug } = await params;
  return <PrintView bookSlug={bookSlug} />;
}
