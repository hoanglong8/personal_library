"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth";

// Split out of AdminLink so layout.tsx can place it first in the nav —
// it's the first step of the content pipeline (bring content in, then
// review/edit it, then it shows up in Tủ sách), so it goes ahead of
// Tủ sách rather than after Quản lý nội dung like the other admin links.
export default function ImportLink() {
  const session = useSession();
  if (!session) return null;

  return (
    <Link href="/admin/import" className="text-xs text-paper-400 hover:text-accent transition-colors">
      Tiếp nhận nội dung
    </Link>
  );
}
