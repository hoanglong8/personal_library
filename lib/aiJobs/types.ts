import type { Book } from "@/lib/types";

// What a job handler produces, before the Route Handler writes it to
// `books`. tag/summarize/classify edit an already-published book, staged
// in `pending_data` for review (see supabase/books-pending-edit.sql) —
// translate/ingest create a brand new book row with status='draft'.
export type AiJobOutcome =
  | { kind: "pending-edit"; slug: string; data: Omit<Book, "slug"> }
  | { kind: "new-draft"; slug: string; data: Omit<Book, "slug"> };
