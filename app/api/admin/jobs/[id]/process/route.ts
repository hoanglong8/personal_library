import { requireAdmin } from "@/lib/adminAuth";
import { getAdminSupabase } from "@/lib/supabaseAdminClient";
import type { Book } from "@/lib/types";
import { runTagJob } from "@/lib/aiJobs/tag";
import { runClassifyJob } from "@/lib/aiJobs/classify";
import { runSummarizeJob } from "@/lib/aiJobs/summarize";
import { runTranslateJob } from "@/lib/aiJobs/translate";
import { runIngestJob } from "@/lib/aiJobs/ingest";
import type { AiJobOutcome } from "@/lib/aiJobs/types";

// Vercel's default Node function timeout (10s on Hobby) is too short for
// translate, which makes one sequential Gemini call per module — a
// 15-module book could take well over a minute. 60 is the max allowed on
// Hobby; upgrading to Pro would allow more if a book turns out too big
// even for that.
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await params;
  const supabase = getAdminSupabase();

  const { data: job, error: jobError } = await supabase
    .from("ai_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (jobError || !job) {
    return Response.json({ error: "Không tìm thấy job." }, { status: 404 });
  }
  if (job.status === "processing") {
    // A job can get stuck at "processing" forever if the route itself gets
    // killed mid-flight (e.g. Vercel's gateway 504-ing a hung request) —
    // this happened once in testing and left no way to retry without a
    // manual DB fix. Treat "processing" for more than 90s as stale rather
    // than trusting it indefinitely; a genuinely in-flight job (normal
    // case takes well under a minute per the timing test in the roadmap)
    // still gets the 409.
    const staleMs = Date.now() - new Date(job.updated_at).getTime();
    if (staleMs < 90_000) {
      return Response.json({ error: "Job đang được xử lý." }, { status: 409 });
    }
  }

  await supabase.from("ai_jobs").update({ status: "processing" }).eq("id", id);

  try {
    let book: Book | null = null;
    if (job.book_id) {
      const { data: bookRow, error: bookError } = await supabase
        .from("books")
        .select("slug, data")
        .eq("slug", job.book_id)
        .eq("status", "published")
        .single();
      if (bookError || !bookRow) {
        throw new Error(`Không tìm thấy sách đã publish với slug "${job.book_id}".`);
      }
      book = { slug: bookRow.slug, ...(bookRow.data as Omit<Book, "slug">) };
    }

    let outcome: AiJobOutcome;
    switch (job.job_type) {
      case "tag":
        if (!book) throw new Error("Job tag cần book_id.");
        outcome = await runTagJob(book);
        break;
      case "classify":
        if (!book) throw new Error("Job classify cần book_id.");
        outcome = await runClassifyJob(book);
        break;
      case "summarize":
        if (!book) throw new Error("Job summarize cần book_id.");
        outcome = await runSummarizeJob(book);
        break;
      case "translate":
        if (!book) throw new Error("Job translate cần book_id.");
        outcome = await runTranslateJob(book, job.payload ?? {});
        break;
      case "ingest":
        outcome = await runIngestJob(job.payload ?? {});
        break;
      default:
        throw new Error(`job_type "${job.job_type}" chưa được hỗ trợ xử lý.`);
    }

    if (outcome.kind === "pending-edit") {
      const { error: updateError } = await supabase
        .from("books")
        .update({ pending_data: outcome.data })
        .eq("slug", outcome.slug);
      if (updateError) throw new Error(`Ghi pending_data thất bại: ${updateError.message}`);
    } else {
      const { data: existing } = await supabase
        .from("books")
        .select("slug")
        .eq("slug", outcome.slug)
        .maybeSingle();
      if (existing) {
        throw new Error(`Slug "${outcome.slug}" đã tồn tại — không tạo bản nháp trùng.`);
      }
      const { error: insertError } = await supabase
        .from("books")
        .insert({ slug: outcome.slug, data: outcome.data, status: "draft", source: "ingested" });
      if (insertError) throw new Error(`Tạo sách nháp thất bại: ${insertError.message}`);
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "ready_for_review",
        result: { outcomeKind: outcome.kind, slug: outcome.slug },
        error_message: null,
      })
      .eq("id", id);

    return Response.json({ status: "ready_for_review", slug: outcome.slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase
      .from("ai_jobs")
      .update({
        status: "error",
        error_message: message,
        attempt_count: (job.attempt_count ?? 0) + 1,
      })
      .eq("id", id);
    return Response.json({ error: message }, { status: 500 });
  }
}
