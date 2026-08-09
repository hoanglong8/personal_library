-- Storage bucket for portal images (book thumbnails + in-article images).
-- Run in Supabase SQL editor (project > SQL Editor > New query), same
-- project already used for comments (see schema.sql).
--
-- Bucket is public-read, and open to anonymous upload — same "no auth by
-- design" philosophy as the comments table, guarded by a server-side size
-- limit and an image-only mime allowlist (both enforced by Supabase, not
-- just the client) so an anon key can't be used to dump arbitrary/huge
-- files into the project.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portal-images',
  'portal-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No SELECT policy needed: public buckets (public = true above) already
-- serve object reads via the public URL without going through RLS. Adding
-- a broad SELECT policy on storage.objects would only let clients LIST/
-- enumerate every uploaded file's metadata — Supabase's own dashboard
-- linter flags this as unnecessary exposure for a public bucket, so it's
-- deliberately left out.

-- Anyone (anon key) can upload to this bucket — no auth required by
-- design, matching the comments policy. Tighten this (e.g. require
-- auth.uid(), or move behind a signed-upload edge function) if the open
-- upload page in app/chen-anh/page.tsx ever gets abused.
create policy "anyone can upload to portal-images"
  on storage.objects for insert
  with check (bucket_id = 'portal-images');
