import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Fetches a book regardless of status (draft/reviewed/published) — the
// public anon-key path (lib/content.ts) only ever returns published rows,
// but the admin editor needs to open any book to edit it.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("books")
    .select("slug, status, source, data")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return Response.json({ error: "Không tìm thấy sách." }, { status: 404 });
  }
  return Response.json({ book: data });
}
