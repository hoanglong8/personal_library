import type { NoteSection } from "@/lib/types";

const VARIANT_LABEL: Record<NoteSection["variant"], string> = {
  tip: "Ghi chú",
  warning: "Lưu ý",
  definition: "Định nghĩa",
};

const VARIANT_BORDER: Record<NoteSection["variant"], string> = {
  tip: "border-l-accent",
  warning: "border-l-danger",
  definition: "border-l-paper-400",
};

export default function NoteCallout({ section }: { section: NoteSection }) {
  return (
    <div
      className={`border-l-4 ${VARIANT_BORDER[section.variant]} bg-surface pl-4 py-3 text-sm`}
    >
      <span className="font-mono text-xs uppercase tracking-widest text-paper-400">
        {VARIANT_LABEL[section.variant]}
        {section.title ? ` · ${section.title}` : ""}
      </span>
      <p className="mt-1 text-ink-soft leading-relaxed">{section.body}</p>
    </div>
  );
}
