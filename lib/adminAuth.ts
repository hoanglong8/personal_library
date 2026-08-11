import { createClient } from "@supabase/supabase-js";

// Server-only. This project's Supabase session lives in browser
// localStorage (default createClient behavior), not a cookie — so there is
// no server-readable session for a traditional middleware.ts to check.
// Instead, admin Route Handlers require the caller to send its access
// token as `Authorization: Bearer <token>` (see lib/adminFetch.ts on the
// client side); this function verifies that token against Supabase Auth
// and checks the resulting email against ADMIN_EMAIL. This — not
// app/admin/layout.tsx, which is UX only — is the real security boundary.
export async function requireAdmin(
  request: Request
): Promise<{ email: string } | { errorResponse: Response }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!url || !anonKey || !adminEmail) {
    return {
      errorResponse: Response.json(
        { error: "Server chưa cấu hình đủ Supabase/ADMIN_EMAIL." },
        { status: 500 }
      ),
    };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { errorResponse: Response.json({ error: "Thiếu access token." }, { status: 401 }) };
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    return { errorResponse: Response.json({ error: "Token không hợp lệ." }, { status: 401 }) };
  }

  if (data.user.email !== adminEmail) {
    return { errorResponse: Response.json({ error: "Không có quyền truy cập." }, { status: 403 }) };
  }

  return { email: data.user.email };
}
