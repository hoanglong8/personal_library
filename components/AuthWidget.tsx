"use client";

import { useState, type FormEvent } from "react";
import { useSession, signInWithMagicLink, signOut, isSupabaseConfigured } from "@/lib/auth";

export default function AuthWidget() {
  const session = useSession();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!isSupabaseConfigured) return null;

  if (session) {
    return (
      <div className="flex items-center gap-2 text-xs text-paper-400">
        <span className="hidden sm:inline">{session.user.email}</span>
        <button
          onClick={() => signOut()}
          className="rounded-full border border-border px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <p className="text-xs text-paper-400">
        Đã gửi link đăng nhập tới <span className="text-ink">{email}</span> — kiểm tra email.
      </p>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const { error } = await signInWithMagicLink(email.trim());
    setStatus(error ? "error" : "sent");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email của bạn"
        className="w-32 rounded-full border border-border bg-surface px-3 py-1.5 text-xs outline-none focus:border-accent sm:w-44"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink disabled:opacity-50"
      >
        {status === "sending" ? "Đang gửi..." : "Đăng nhập"}
      </button>
      {status === "error" && <span className="text-xs text-danger">Lỗi, thử lại</span>}
    </form>
  );
}
