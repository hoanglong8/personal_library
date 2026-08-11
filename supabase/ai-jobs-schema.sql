-- AI job queue: admin submits a job (tag / summarize / classify /
-- translate / ingest), a Route Handler processes it on demand (see
-- app/api/admin/jobs/[id]/process), result lands as a `books` row with
-- status='draft' for the existing admin review flow to approve/reject.
--
-- Run in Supabase SQL editor (project > SQL Editor > New query), same
-- project already used for comments/books/reading_progress/bookmarks.

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null check (job_type in ('ingest', 'summarize', 'tag', 'classify', 'translate')),
  -- Source book for summarize/tag/classify/translate; null for ingest
  -- (which creates a brand new book with no prior slug).
  book_id text,
  -- Per-type parameters, e.g. {"targetLang": "en"} for translate,
  -- {"driveFolderUrl": "..."} for ingest.
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready_for_review', 'error')),
  -- Per-type outcome, e.g. {"draftSlug": "..."} once a books row is written.
  result jsonb,
  error_message text,
  attempt_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_jobs_status_idx on public.ai_jobs (status);

alter table public.ai_jobs enable row level security;

-- No policies for anon/authenticated: this is an admin-only queue, every
-- read/write goes through server code using the service_role key (same
-- rationale as `books` in supabase/books-schema.sql).

create or replace function public.set_ai_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_jobs_set_updated_at on public.ai_jobs;
create trigger ai_jobs_set_updated_at
  before update on public.ai_jobs
  for each row
  execute function public.set_ai_jobs_updated_at();
