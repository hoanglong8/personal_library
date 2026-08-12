import type { Book } from "@/lib/types";

// What a job handler produces, before the Route Handler writes it to
// `books`. tag/summarize/classify edit an existing book — staged in
// `pending_data` for review if that book is already published (see
// supabase/books-pending-edit.sql), or written straight to `data` if it
// isn't public yet (submitting the job from Biên tập nội dung already IS
// the review step for a draft/reviewed book, see the process route) —
// translate/ingest create a brand new book row with status='draft'.
export type AiJobOutcome =
  | { kind: "pending-edit"; slug: string; data: Omit<Book, "slug"> }
  | { kind: "new-draft"; slug: string; data: Omit<Book, "slug"> };
