import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Pulls a live book back offline (status='published' -> 'reviewed') without
// deleting its content — it stays reviewed and can be published again
// later. Only valid from status='published'.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const supabase = getAdminSupabase();

  const { data: book, error: fetchError } = await supabase
    .from("books")
    .select("slug, status")
    .eq("slug", slug)
    .single();

  if (fetchError || !book) {
    return Response.json({ error: "Không tìm thấy sách." }, { status: 404 });
  }
  if (book.status !== "published") {
    return Response.json({ error: "Sách này chưa được công khai." }, { status: 400 });
  }

  const { error } = await supabase.from("books").update({ status: "reviewed" }).eq("slug", slug);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidateTag("books", { expire: 0 });
  return Response.json({ status: "reviewed", slug });
}
