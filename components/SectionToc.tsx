import type { Section } from "@/lib/types";

// Right-hand "on this page" panel — sections of the module currently being
// read, not the whole book (that's ModuleNav, on the left). Plain links to
// in-page anchors (SectionRenderer already sets id={section.id}), no
// client state needed.
export default function SectionToc({ sections }: { sections: Section[] }) {
  return (
    <nav className="hidden xl:block sticky top-20 h-fit w-64 shrink-0 text-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-paper-400">
        Trong chương này
      </p>
      <ul className="mt-3 space-y-1 border-l border-border">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-ink-soft transition-colors hover:border-border hover:text-ink"
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
