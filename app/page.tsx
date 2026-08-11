import BookGrid from "@/components/BookGrid";
import { getBooks } from "@/lib/content";

export default async function HomePage() {
  const books = await getBooks();
  return <BookGrid books={books} />;
}
