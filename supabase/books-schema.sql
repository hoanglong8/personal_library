-- Source of truth for book content (replaces content/portal.json at runtime).
-- Run in Supabase SQL editor (project > SQL Editor > New query), same
-- project already used for comments/storage (see schema.sql, storage-setup.sql).
--
-- `data` holds the exact `Book` shape from lib/types.ts (`{ meta, modules }`)
-- as jsonb — no separate module/section tables, this site never needs to
-- query a single section on its own, only whole books.
--
-- Unlike `comments`/`portal-images` (deliberately open, no auth), this table
-- is editorial content for the whole site: writes only happen through server
-- code using the service_role key (admin approval flow, migration script,
-- AI job workers) — never through the anon key used by the browser.

create table if not exists public.books (
  slug text primary key,
  data jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  source text not null default 'manual' check (source in ('manual', 'ingested')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_status_idx on public.books (status);

alter table public.books enable row level security;

-- Anyone (anon key) can read only published books — drafts stay invisible
-- to the public site until an admin approves them.
create policy "published books are publicly readable"
  on public.books for select
  using (status = 'published');

-- No insert/update/delete policy for anon/authenticated: every write goes
-- through server code holding the service_role key, which bypasses RLS by
-- design. Do not add a broader policy here "for convenience" — that would
-- let any signed-in reader edit book content.

-- Keep `updated_at` accurate without relying on every write path to set it.
create or replace function public.set_books_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
  before update on public.books
  for each row
  execute function public.set_books_updated_at();
