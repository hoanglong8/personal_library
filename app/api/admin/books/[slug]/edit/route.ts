import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Direct admin edit — unlike tag/summarize/classify (AI proposals staged
// in pending_data awaiting a separate "Duyệt"), a human admin editing
// their own content IS the review step, so this writes straight into
// `data` regardless of the book's current status. Immediate revalidate
// only matters when the book is already live.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const body = await request.json();
  const data = body.data;

  if (
    !data ||
    typeof data.meta !== "object" ||
    typeof data.meta.title !== "string" ||
    !Array.isArray(data.modules)
  ) {
    return Response.json(
      { error: "Dữ liệu không hợp lệ — thiếu meta.title hoặc modules." },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("books")
    .select("status")
    .eq("slug", slug)
    .single();
  if (fetchError || !existing) {
    return Response.json({ error: "Không tìm thấy sách." }, { status: 404 });
  }

  const { error } = await supabase.from("books").update({ data }).eq("slug", slug);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (existing.status === "published") {
    revalidateTag("books", { expire: 0 });
  }

  return Response.json({ status: "saved", slug });
}
