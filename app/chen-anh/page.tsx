"use client";

import { useState, type ChangeEvent } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB — khớp file_size_limit của bucket portal-images
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

function randomFileName(originalName: string) {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "jpg";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}.${ext}`;
}

function ResultLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-bg p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Xem trước" className="max-h-64 w-full rounded-md object-contain" />
      <div className="mt-3 flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono text-ink-soft"
          onFocus={(e) => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-ink hover:opacity-90 transition-opacity"
        >
          {copied ? "Đã chép ✓" : "Chép link"}
        </button>
      </div>
    </div>
  );
}

function PasteLinkTab() {
  const [input, setInput] = useState("");
  const [confirmed, setConfirmed] = useState<string | null>(null);

  return (
    <div>
      <label className="text-sm text-ink-soft">Dán link ảnh công khai (jpg, png, webp, gif, svg...)</label>
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://..."
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => setConfirmed(input.trim() || null)}
          disabled={!input.trim()}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
        >
          Xem trước
        </button>
      </div>
      {confirmed && <ResultLink url={confirmed} />}
    </div>
  );
}

function UploadTab() {
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState("");
  const [url, setUrl] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase) return;

    setError("");
    setUrl(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Chỉ nhận ảnh JPG, PNG, WEBP, GIF hoặc SVG.");
      setStatus("error");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Ảnh vượt quá 5MB — nén lại trước khi tải lên.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    const path = randomFileName(file.name);
    const { error: uploadError } = await supabase.storage
      .from("portal-images")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setError(`Tải lên thất bại: ${uploadError.message}`);
      setStatus("error");
      return;
    }

    const { data } = supabase.storage.from("portal-images").getPublicUrl(path);
    setUrl(data.publicUrl);
    setStatus("idle");
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="text-sm text-ink-soft">
        Tải ảnh lên chưa hoạt động — chưa cấu hình Supabase (biến môi trường
        <code className="mx-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
        /
        <code className="mx-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
        ). Dùng tạm tab &quot;Dán link&quot;.
      </p>
    );
  }

  return (
    <div>
      <label className="text-sm text-ink-soft">
        Chọn ảnh từ máy (tối đa 5MB — JPG, PNG, WEBP, GIF, SVG)
      </label>
      <input
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        onChange={handleFile}
        disabled={status === "uploading"}
        className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-xs file:font-medium file:text-accent hover:file:opacity-90"
      />
      {status === "uploading" && (
        <p className="mt-2 text-xs text-paper-400">Đang tải lên...</p>
      )}
      {status === "error" && <p className="mt-2 text-xs text-danger">{error}</p>}
      {url && <ResultLink url={url} />}
    </div>
  );
}

export default function ChenAnhPage() {
  const [tab, setTab] = useState<"link" | "upload">("upload");

  return (
    <section className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="text-xs text-paper-400 hover:text-accent">
        ← Thư viện
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-ink">Chèn ảnh</h1>
      <p className="mt-2 text-ink-soft">
        Tải ảnh lên hoặc dán link có sẵn để lấy về một đường dẫn ảnh công
        khai — dùng làm ảnh thumbnail của bài viết (
        <code className="font-mono text-xs">meta.thumbnail</code>) hoặc
        chèn vào giữa nội dung bài viết (khối ảnh kiểu{" "}
        <code className="font-mono text-xs">{'{ "type": "image" }'}</code>).
        Trang này chỉ tạo link ảnh — đưa link đó cho Claude Code (hoặc tự
        dán vào <code className="font-mono text-xs">content/portal.json</code>) để
        thực sự gắn vào một bài viết cụ thể.
      </p>

      <div className="mt-8 flex gap-1 rounded-full border border-border bg-surface p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 rounded-full px-4 py-2 transition-colors ${
            tab === "upload" ? "bg-accent-soft text-accent font-medium" : "text-ink-soft"
          }`}
        >
          Tải ảnh lên
        </button>
        <button
          type="button"
          onClick={() => setTab("link")}
          className={`flex-1 rounded-full px-4 py-2 transition-colors ${
            tab === "link" ? "bg-accent-soft text-accent font-medium" : "text-ink-soft"
          }`}
        >
          Dán link có sẵn
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        {tab === "upload" ? <UploadTab /> : <PasteLinkTab />}
      </div>
    </section>
  );
}
