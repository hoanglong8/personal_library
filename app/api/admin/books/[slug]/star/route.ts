import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";
import type { Book } from "@/lib/types";

// Toggles meta.featured — a manual curation flag ("★") shown in Quản lý
// nội dung, independent of the draft/reviewed/published pipeline. Reads
// then writes `data` as a whole (same as [slug]/edit/route.ts) rather than
// a dedicated column, since `data` is already the single source of truth
// for book content/meta.
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { slug } = await params;
  const supabase = getAdminSupabase();

  const { data: row, error: fetchError } = await supabase
    .from("books")
    .select("status, data")
    .eq("slug", slug)
    .single();
  if (fetchError || !row) {
    return Response.json({ error: "Không tìm thấy sách." }, { status: 404 });
  }

  const data = row.data as Omit<Book, "slug">;
  const featured = !data.meta.featured;
  const nextData = { ...data, meta: { ...data.meta, featured } };

  const { error } = await supabase.from("books").update({ data: nextData }).eq("slug", slug);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (row.status === "published") {
    revalidateTag("books", { expire: 0 });
  }
  return Response.json({ slug, featured });
}
