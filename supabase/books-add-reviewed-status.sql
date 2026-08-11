-- Adds a 3rd `books.status` value: 'reviewed' — content an admin has
-- approved (via the "Duyệt" action) but not yet made public. Splits what
-- used to be one action ("Duyệt" = accept content AND go live at once)
-- into two: Duyệt (draft -> reviewed) and Publish (reviewed -> published),
-- plus a new Unpublish (published -> reviewed) to pull a live book back
-- offline without losing its content or re-running any AI job.
--
-- RLS is unaffected: the existing policy already only allows public SELECT
-- when status='published' (see supabase/books-schema.sql), so 'reviewed'
-- rows stay exactly as hidden from readers as 'draft' rows already were.
--
-- Run in Supabase SQL editor after books-schema.sql. The constraint name
-- below (`books_status_check`) is Postgres's auto-generated name for an
-- unnamed inline CHECK on the `status` column — if this errors with
-- "constraint does not exist", open Table Editor -> books -> find the
-- actual check constraint name under its definition and substitute it.

alter table public.books drop constraint if exists books_status_check;
alter table public.books add constraint books_status_check
  check (status in ('draft', 'reviewed', 'published'));
