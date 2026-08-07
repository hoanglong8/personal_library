function DefaultThumbnail() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-accent-soft">
      <svg
        width="52"
        height="52"
        viewBox="0 0 48 48"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M24 11c-3.8-2.6-8.5-3.1-14-2.1v24c5.5-1 10.2-.5 14 2.1 3.8-2.6 8.5-3.1 14-2.1v-24c-5.5-1-10.2-.5-14 2.1Z" />
        <path d="M24 11v24" />
        <path d="M13.5 15.5c2.7-.5 5-.3 7 .6M13.5 21c2.7-.5 5-.3 7 .6M13.5 26.5c2.7-.5 5-.3 7 .6" opacity="0.6" />
      </svg>
    </div>
  );
}

export default function BookThumbnail({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  return (
    <div className="aspect-[16/9] w-full overflow-hidden border-b border-border bg-accent-soft">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <DefaultThumbnail />
      )}
    </div>
  );
}
