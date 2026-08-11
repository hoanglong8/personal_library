import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

// Creates a brand-new book as status='draft' — used by the "Nhập sách mới
// từ .md" admin flow (manually-translated/authored content, as opposed to
// translate/ingest AI jobs which write the same shape via lib/aiJobs/*).
// Goes through the same review flow afterward (Duyệt -> Publish).
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await request.json();
  const slug = body.slug;
  const data = body.data;

  if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return Response.json({ error: "slug không hợp lệ (chỉ chữ thường, số, dấu -)." }, { status: 400 });
  }
  if (
    !data ||
    typeof data.meta !== "object" ||
    typeof data.meta.title !== "string" ||
    !Array.isArray(data.modules) ||
    data.modules.length === 0
  ) {
    return Response.json(
      { error: "Dữ liệu không hợp lệ — thiếu meta.title hoặc modules rỗng." },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  const { data: existing } = await supabase.from("books").select("slug").eq("slug", slug).maybeSingle();
  if (existing) {
    return Response.json({ error: `Slug "${slug}" đã tồn tại.` }, { status: 400 });
  }

  const { error } = await supabase
    .from("books")
    .insert({ slug, data, status: "draft", source: "manual" });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ status: "draft", slug });
}
