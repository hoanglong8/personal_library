"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth";

export default function TuSachLink() {
  const session = useSession();
  if (!session) return null;

  return (
    <Link
      href="/tu-sach"
      className="text-xs text-paper-400 hover:text-accent transition-colors"
    >
      Tuyển tập
    </Link>
  );
}
