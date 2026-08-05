import Link from "next/link";
import type { Module } from "@/lib/types";

export default function ModuleNav({
  modules,
  activeId,
}: {
  modules: Module[];
  activeId: string;
}) {
  return (
    <nav className="hidden lg:block sticky top-20 h-fit w-56 shrink-0 text-sm">
      <ul className="space-y-1 border-l border-border">
        {modules.map((m, i) => {
          const active = m.id === activeId;
          return (
            <li key={m.id}>
              <Link
                href={`/modules/${m.id}`}
                className={`-ml-px block border-l-2 py-1.5 pl-4 transition-colors ${
                  active
                    ? "border-accent text-accent font-medium"
                    : "border-transparent text-ink-soft hover:text-ink hover:border-border"
                }`}
              >
                {String(i + 1).padStart(2, "0")}. {m.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
