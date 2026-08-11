import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Makes a reviewed (approved-but-not-yet-live) book public on the
// homepage. Only valid from status='reviewed' — content must go through
// approve/route.ts first. (Editing an already-published book via
// tag/summarize/classify never touches this route: those merge straight
// into `data` on approve since the book was already live.)
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
  if (book.status !== "reviewed") {
    return Response.json(
      { error: `Chỉ publish được sách ở trạng thái "reviewed" (hiện tại: "${book.status}").` },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("books").update({ status: "published" }).eq("slug", slug);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // { expire: 0 } for immediate invalidation, not the "max" stale-while-
  // revalidate default — publishing should show up right away.
  revalidateTag("books", { expire: 0 });
  return Response.json({ status: "published", slug });
}
