import type { ImageSection } from "@/lib/types";

export default function ImageBlock({ section }: { section: ImageSection }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={section.url}
        alt={section.alt}
        loading="lazy"
        className="w-full object-cover"
      />
      {(section.title || section.caption) && (
        <figcaption className="border-t border-border px-4 py-3 text-sm text-ink-soft">
          {section.title && <span className="font-medium text-ink">{section.title}</span>}
          {section.title && section.caption ? " — " : ""}
          {section.caption}
        </figcaption>
      )}
    </figure>
  );
}
