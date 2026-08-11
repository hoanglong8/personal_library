import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const supabase = getAdminSupabase();

  const { data: book, error: fetchError } = await supabase
    .from("books")
    .select("slug, status, pending_data")
    .eq("slug", slug)
    .single();

  if (fetchError || !book) {
    return Response.json({ error: "Không tìm thấy sách." }, { status: 404 });
  }

  if (book.status === "draft" || book.status === "reviewed") {
    // Never-published (draft, from translate/ingest) or reviewed-but-still-
    // offline — reject means delete it outright, there's no earlier
    // published version to fall back to either way. A currently-published
    // book must be unpublished first (see unpublish/route.ts) before it
    // can be rejected/deleted — this branch never reaches a live book.
    const { error } = await supabase.from("books").delete().eq("slug", slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else if (book.pending_data) {
    // A proposed edit to an already-published book — reject just discards
    // the proposal, the live `data` was never touched.
    const { error } = await supabase.from("books").update({ pending_data: null }).eq("slug", slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    return Response.json({ error: "Sách này không có gì đang chờ duyệt." }, { status: 400 });
  }

  return Response.json({ status: "rejected", slug });
}
