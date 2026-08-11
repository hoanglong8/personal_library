-- Reader-owned data: which modules a signed-in reader has marked read, and
-- which sections they've bookmarked. Run in Supabase SQL editor (project >
-- SQL Editor > New query), same project already used for comments/books.
--
-- Unlike `comments` (public, no auth) and `books` (editorial, service_role
-- only), these two tables are private per-user data: RLS restricts every
-- row to its own `auth.uid()`, both for reading and writing — a signed-in
-- reader can only ever see/change their own progress and bookmarks, never
-- another reader's.

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  module_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, book_id, module_id)
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id text not null,
  section_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, book_id, section_id)
);

alter table public.reading_progress enable row level security;
alter table public.bookmarks enable row level security;

create policy "own reading progress" on public.reading_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own bookmarks" on public.bookmarks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
