"use client";

import { useSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

// UX-only gate: hides the admin UI from a visitor with no session at all.
// This is NOT the security boundary — a signed-in non-admin reader could
// still load this layout, but every actual admin API call (lib/adminFetch
// + lib/adminAuth.requireAdmin) independently verifies the caller's email
// server-side and rejects with 403, so no real action or data exposure
// depends on this client-side check.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();

  if (!isSupabaseConfigured) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-sm text-paper-400">Tính năng chưa được kích hoạt.</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="text-2xl font-semibold text-ink">Quản trị</h1>
        <p className="mt-4 text-sm text-paper-400">
          Đăng nhập ở góc trên bằng email admin để vào khu vực quản trị.
        </p>
      </section>
    );
  }

  return <div className="mx-auto max-w-4xl px-6 py-10">{children}</div>;
}
