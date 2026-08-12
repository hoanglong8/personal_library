"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth";

// Shown to any signed-in reader, not just the real admin — we deliberately
// don't expose ADMIN_EMAIL to the client (see lib/adminAuth.ts), so there
// is no client-side way to know who the admin is. A non-admin clicking
// through just sees empty lists / a 403 message from the API; no real
// data or action is exposed by showing these links.
//
// Two direct links rather than one "Admin" link into a landing page — the
// extra click through app/admin/page.tsx just to reach either sub-page
// was pure friction for the one person who actually uses this.
export default function AdminLink() {
  const session = useSession();
  if (!session) return null;

  return (
    <>
      <Link href="/admin/jobs" className="text-xs text-paper-400 hover:text-accent transition-colors">
        AI Job Queue
      </Link>
      <Link href="/admin/drafts" className="text-xs text-paper-400 hover:text-accent transition-colors">
        Quản lý nội dung
      </Link>
    </>
  );
}
