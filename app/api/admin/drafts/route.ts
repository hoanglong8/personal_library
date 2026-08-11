import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Returns every book regardless of status — the page buckets them into 3
// sections client-side: needs review (status='draft' or pending_data set),
// reviewed-but-offline (status='reviewed'), and live (status='published').
// A published book can appear in both the review section (if it also has
// a pending_data edit awaiting approval) and the live section (to offer
// "Ngừng công khai") at once — that's intentional, not a bug.
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("books")
    .select("slug, status, source, data, pending_data, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ drafts: data });
}
