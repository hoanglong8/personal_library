-- Staging column for proposed edits to an EXISTING published book (used by
-- AI jobs tag/summarize/classify — see lib/aiJobs/*.ts). Run this after
-- supabase/books-schema.sql has already been applied (do not re-run
-- books-schema.sql itself: its `create policy` statements are not
-- idempotent and will error "already exists" on a second run).
--
-- Why a separate column instead of writing status='draft' like
-- translate/ingest do: those two job types create a brand NEW book with a
-- new slug, so a draft row never collides with a published one. tag/
-- summarize/classify edit a book that is ALREADY published under its
-- existing slug (the primary key) — writing straight into `data` would
-- publish the AI's proposed edit immediately with no review step.
-- `pending_data` holds the proposed full replacement for `data`, reviewed
-- and applied (or discarded) via app/api/admin/books/[slug]/publish and
-- .../reject, leaving the live `data` untouched until approved.

alter table public.books add column if not exists pending_data jsonb;
