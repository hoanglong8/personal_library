import { createClient } from "@supabase/supabase-js";

// Server-only client using the service_role key, which bypasses RLS —
// never import this from a Client Component or expose it via a
// NEXT_PUBLIC_* variable. Used by admin Route Handlers, the AI job
// workers, and one-off scripts (migrate-portal-json-to-supabase.mjs) that
// need to write to `books` (see supabase/books-schema.sql: no
// insert/update/delete policy exists for the anon key by design).
export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY chưa được cấu hình — " +
        "không thể ghi dữ liệu sách. Xem .env.example (SUPABASE_SERVICE_ROLE_KEY " +
        "lấy ở Project Settings → API, KHÔNG đặt tên biến có tiền tố NEXT_PUBLIC_)."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
