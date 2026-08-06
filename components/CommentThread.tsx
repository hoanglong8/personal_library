"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Comment {
  id: string;
  book_id: string;
  section_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export default function CommentThread({
  bookSlug,
  sectionId,
}: {
  bookSlug: string;
  sectionId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    client
      .from("comments")
      .select("*")
      .eq("book_id", bookSlug)
      .eq("section_id", sectionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setComments(data as Comment[]);
      });

    // Realtime filters support one column condition, so the subscription is
    // scoped by section_id only; book_id is re-checked in the callback to
    // avoid cross-book leakage when two books happen to reuse a section id.
    const channel = client
      .channel(`comments:${bookSlug}:${sectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `section_id=eq.${sectionId}`,
        },
        (payload) => {
          const row = payload.new as Comment;
          if (row.book_id !== bookSlug) return;
          setComments((prev) => [...prev, row]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [bookSlug, sectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !body.trim()) return;
    setStatus("sending");
    const { error } = await supabase.from("comments").insert({
      book_id: bookSlug,
      section_id: sectionId,
      author_name: name.trim() || "Ẩn danh",
      body: body.trim(),
    });
    if (error) {
      setStatus("error");
      return;
    }
    setBody("");
    setStatus("idle");
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="mt-6 text-xs text-paper-400 border-t border-border pt-4">
        Bình luận chưa được kích hoạt — cấu hình Supabase theo{" "}
        <code className="font-mono">references/supabase-setup.md</code> để mở
        tính năng trao đổi tại mục này.
      </p>
    );
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h4 className="text-sm font-mono uppercase tracking-widest text-paper-400">
        Trao đổi ({comments.length})
      </h4>

      <ul className="mt-4 space-y-4">
        {comments.map((c) => (
          <li key={c.id} className="text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-ink">{c.author_name}</span>
              <span className="text-xs text-paper-400">
                {new Date(c.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
            <p className="mt-0.5 text-ink-soft">{c.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="mt-5 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên của bạn (không bắt buộc)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Chia sẻ nhận xét, câu hỏi, hoặc kinh nghiệm của bạn về mục này..."
          rows={3}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-ink disabled:opacity-50"
        >
          {status === "sending" ? "Đang gửi..." : "Gửi bình luận"}
        </button>
        {status === "error" && (
          <p className="text-xs text-danger">
            Gửi thất bại — kiểm tra RLS policy trong Supabase.
          </p>
        )}
      </form>
    </div>
  );
}
