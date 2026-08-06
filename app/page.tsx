import BookGrid from "@/components/BookGrid";
import { getBooks } from "@/lib/content";

export default function HomePage() {
  const books = getBooks();
  return <BookGrid books={books} />;
}
