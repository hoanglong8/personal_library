"use client";

import { useEffect, useState, type FormEvent } from "react";
import { adminFetch } from "@/lib/adminFetch";
import { supabase } from "@/lib/supabaseClient";

interface BookOption {
  slug: string;
  title: string;
}

interface AiJob {
  id: string;
  job_type: string;
  book_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  result: Record<string, unknown> | null;
  error_message: string | null;
  attempt_count: number;
  created_at: string;
}

const JOB_TYPES = [
  { value: "tag", label: "Gắn tag" },
  { value: "summarize", label: "Tóm tắt (viết lại mô tả)" },
  { value: "classify", label: "Phân loại (domain/field)" },
  { value: "translate", label: "Dịch thuật" },
  { value: "ingest", label: "Nhập từ Google Drive (sách mới)" },
];

export default function AdminJobsPage() {
  const [books, setBooks] = useState<BookOption[]>([]);
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [jobType, setJobType] = useState("tag");
  const [bookSlug, setBookSlug] = useState("");
  const [bookQuery, setBookQuery] = useState("");
  const [showBookSuggestions, setShowBookSuggestions] = useState(false);
  const [targetLang, setTargetLang] = useState("en");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  const bookMatches = bookQuery.trim()
    ? books.filter((b) => b.title.toLowerCase().includes(bookQuery.trim().toLowerCase()))
    : books;

  function selectBook(book: BookOption) {
    setBookSlug(book.slug);
    setBookQuery(book.title);
    setShowBookSuggestions(false);
  }

  async function refreshJobs() {
    const res = await adminFetch("/api/admin/jobs");
    const body = await res.json();
    if (res.ok) setJobs(body.jobs);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("books")
      .select("slug, data")
      .eq("status", "published")
      .then(({ data }) => {
        if (!data) return;
        setBooks(
          data.map((row) => ({
            slug: row.slug as string,
            title: (row.data as { meta?: { title?: string } })?.meta?.title ?? row.slug,
          }))
        );
      });
    // Inlined rather than calling refreshJobs() here: the lint rule
    // react-hooks/set-state-in-effect flags a setState reachable from a
    // named function called synchronously in an effect body, even when
    // that setState only runs after an internal await. A `.then()` chain
    // written directly in the effect (same shape CommentThread.tsx uses)
    // doesn't trip it. refreshJobs() itself stays as-is for reuse from the
    // event handlers below, which aren't effects.
    adminFetch("/api/admin/jobs").then(async (res) => {
      const body = await res.json();
      if (res.ok) setJobs(body.jobs);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (jobType !== "ingest" && !bookSlug) {
      setSubmitError("Chọn 1 sách.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const payload = jobType === "translate" ? { targetLang } : {};
    const res = await adminFetch("/api/admin/jobs", {
      method: "POST",
      body: JSON.stringify({
        job_type: jobType,
        book_id: jobType === "ingest" ? null : bookSlug,
        payload,
      }),
    });
    const body = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(body.error ?? "Lỗi không rõ.");
      return;
    }
    await refreshJobs();
  }

  async function handleProcess(id: string) {
    setProcessingId(id);
    setProcessError(null);
    const res = await adminFetch(`/api/admin/jobs/${id}/process`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setProcessError(body.error ?? `Lỗi HTTP ${res.status}.`);
    }
    setProcessingId(null);
    await refreshJobs();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink">AI Job Queue</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-border p-5">
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setJobType(t.value);
                setBookSlug("");
                setBookQuery("");
              }}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                jobType === t.value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-ink-soft hover:border-accent hover:text-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {jobType !== "ingest" && (
          <div className="relative max-w-sm">
            <input
              value={bookQuery}
              onChange={(e) => {
                setBookQuery(e.target.value);
                setBookSlug("");
                setShowBookSuggestions(true);
              }}
              onFocus={() => setShowBookSuggestions(true)}
              onBlur={() => setTimeout(() => setShowBookSuggestions(false), 150)}
              placeholder="Tìm sách theo tên..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            {showBookSuggestions && (
              <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
                {bookMatches.length === 0 && (
                  <li className="px-3 py-2 text-xs text-paper-400">Không tìm thấy sách phù hợp.</li>
                )}
                {bookMatches.map((b) => (
                  <li key={b.slug}>
                    <button
                      type="button"
                      onClick={() => selectBook(b)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent-soft hover:text-accent"
                    >
                      {b.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {bookSlug && (
              <p className="mt-1 text-xs text-accent">Đã chọn: {bookQuery}</p>
            )}
          </div>
        )}

        {jobType === "ingest" && (
          <p className="text-xs text-paper-400">
            Đọc từ folder Drive mặc định đã cấu hình — sẽ tạo 1 sách nháp mới.
          </p>
        )}

        {jobType === "translate" && (
          <input
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            placeholder="Mã ngôn ngữ đích, vd en"
            className="w-40 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-ink disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi job"}
        </button>
        {submitError && <p className="text-xs text-danger">{submitError}</p>}
      </form>

      <h2 className="mt-8 text-sm font-mono uppercase tracking-widest text-paper-400">
        Job gần đây
      </h2>
      {processError && <p className="mt-2 text-xs text-danger">{processError}</p>}
      <ul className="mt-4 space-y-3">
        {jobs.map((job) => (
          <li key={job.id} className="rounded-xl border border-border p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-medium text-ink">{job.job_type}</span>{" "}
                <span className="text-paper-400">— {job.book_id ?? "(không có book)"}</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  job.status === "error"
                    ? "bg-danger/10 text-danger"
                    : job.status === "ready_for_review"
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-raised text-paper-400"
                }`}
              >
                {job.status}
              </span>
            </div>
            {job.error_message && (
              <p className="mt-2 text-xs text-danger">{job.error_message}</p>
            )}
            {job.result?.slug ? (
              <p className="mt-2 text-xs text-paper-400">
                Kết quả: slug <span className="text-ink">{String(job.result.slug)}</span> — xem ở
                trang Bản nháp.
              </p>
            ) : null}
            {(job.status === "pending" || job.status === "error" || job.status === "processing") && (
              <button
                onClick={() => handleProcess(job.id)}
                disabled={processingId === job.id}
                className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {processingId === job.id
                  ? "Đang xử lý..."
                  : job.status === "processing"
                    ? "Job có thể đã bị treo — bấm để thử lại"
                    : "Xử lý ngay"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
