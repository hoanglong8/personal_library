-- Learning portal comments table.
-- Run in Supabase SQL editor (project > SQL Editor > New query).

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  author_name text not null default 'Ẩn danh',
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_section_id_idx on public.comments (section_id);

alter table public.comments enable row level security;

-- Anyone (anon key) can read all comments.
create policy "comments are publicly readable"
  on public.comments for select
  using (true);

-- Anyone (anon key) can post a comment. No auth required by design —
-- this is a public discussion feature, not a moderated account system.
-- Tighten this policy (e.g. require auth.uid()) if you need moderation.
create policy "anyone can post a comment"
  on public.comments for insert
  with check (char_length(body) between 1 and 2000);

-- Enable realtime so CommentThread.tsx receives new comments live.
alter publication supabase_realtime add table public.comments;
