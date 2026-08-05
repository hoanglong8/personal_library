"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Comment {
  id: string;
  section_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export default function CommentThread({ sectionId }: { sectionId: string }) {
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
      .eq("section_id", sectionId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active && data) setComments(data as Comment[]);
      });

    const channel = client
      .channel(`comments:${sectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `section_id=eq.${sectionId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [sectionId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !body.trim()) return;
    setStatus("sending");
    const { error } = await supabase.from("comments").insert({
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
