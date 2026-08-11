import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// "Duyệt" — accepts the AI-proposed content, but does NOT make it public
// on its own (see publish/route.ts for that, a separate explicit step):
// - status='draft' (brand new book from translate/ingest) -> 'reviewed'.
// - pending_data set (proposed edit to an already-published book) -> merge
//   into `data`, clear pending_data. The book was already public, so this
//   one DOES need revalidateTag (content changed on a live page); the
//   draft->reviewed case doesn't, since 'reviewed' is still not publicly
//   readable (see supabase/books-schema.sql RLS: only status='published').
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

  if (book.status === "draft") {
    const { error } = await supabase.from("books").update({ status: "reviewed" }).eq("slug", slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ status: "reviewed", slug });
  }

  if (book.pending_data) {
    const { error } = await supabase
      .from("books")
      .update({ data: book.pending_data, pending_data: null })
      .eq("slug", slug);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    revalidateTag("books", { expire: 0 });
    return Response.json({ status: book.status, slug });
  }

  return Response.json({ error: "Sách này không có gì đang chờ duyệt." }, { status: 400 });
}
