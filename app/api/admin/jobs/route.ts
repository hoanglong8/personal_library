import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";

const JOB_TYPES = ["tag", "summarize", "classify", "translate", "ingest"] as const;
type JobType = (typeof JOB_TYPES)[number];

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("ai_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ jobs: data });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const body = await request.json();
  const jobType = body.job_type as JobType;
  const bookId = typeof body.book_id === "string" ? body.book_id : null;
  const payload = typeof body.payload === "object" && body.payload !== null ? body.payload : {};

  if (!JOB_TYPES.includes(jobType)) {
    return Response.json({ error: `job_type không hợp lệ: ${jobType}` }, { status: 400 });
  }

  if (jobType !== "ingest" && !bookId) {
    return Response.json({ error: "Thiếu book_id." }, { status: 400 });
  }

  if (jobType === "translate" && typeof payload.targetLang !== "string") {
    return Response.json({ error: "Thiếu payload.targetLang cho job translate." }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({ job_type: jobType, book_id: bookId, payload, status: "pending" })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ job: data });
}
