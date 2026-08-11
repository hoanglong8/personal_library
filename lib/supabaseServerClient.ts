import { createClient } from "@supabase/supabase-js";

// Server-side reader for public content (RLS already restricts `books` to
// status='published', so the anon key is enough — no service_role needed
// here). Unlike lib/supabaseClient.ts (used by client components for the
// optional comments feature, which degrades gracefully when unconfigured),
// content reads are load-bearing for every page now that books live in
// Supabase instead of content/portal.json — fail loudly instead of
// returning null so a missing env var shows up as a clear error, not a
// blank site.
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY chưa được cấu hình — " +
        "portal không đọc được nội dung sách từ Supabase. Xem .env.example."
    );
  }

  return createClient(url, anonKey);
}
