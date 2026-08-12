import { getBook } from "@/lib/content";
import { extractDriveFileId } from "@/lib/drive";
import { streamDriveFile } from "@/lib/googleDrive";

// Streams a book's original source document (meta.sourceUrl) through this
// route instead of embedding the source's own domain directly — the
// browser only ever talks to this domain, the actual fetch happens
// server-side and never shows up in the reader's Network tab.
//
// Two paths, depending on what kind of link the admin pasted in the
// editor (see app/admin/edit/[slug]/page.tsx):
// - Google Drive/Docs/Sheets/Slides: authenticated via the Service
//   Account (lib/googleDrive.ts), same as the ingest job.
// - Anything else: proxied as a plain unauthenticated fetch. Only the
//   admin (auth-gated route) can set meta.sourceUrl, so this isn't an
//   open SSRF pivot for arbitrary readers — still restricted to https to
//   rule out file://, internal schemes, etc.
//
// Public (no auth): "Xem bản gốc" has always been open to any reader,
// this route doesn't change that, only where the bytes come from.
export const maxDuration = 30;

function buildHeaders(contentType: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Content-Disposition": "inline",
    // Browser-level cache only — the source document rarely changes once
    // set, and this avoids re-fetching on every single "Xem bản gốc"
    // open. Not a server-side cache layer — deliberately simple for now.
    "Cache-Control": "private, max-age=3600",
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookSlug: string }> }
) {
  const { bookSlug } = await params;

  const book = await getBook(bookSlug);
  if (!book?.meta.sourceUrl) {
    return Response.json({ error: "Sách này không có bản gốc." }, { status: 404 });
  }

  const sourceUrl = book.meta.sourceUrl;
  const fileId = extractDriveFileId(sourceUrl);

  try {
    if (fileId) {
      const { contentType, body } = await streamDriveFile(fileId);
      return new Response(body, { headers: buildHeaders(contentType) });
    }

    if (!sourceUrl.startsWith("https://")) {
      return Response.json({ error: "Link nguồn phải bắt đầu bằng https://." }, { status: 400 });
    }
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok || !res.body) {
      return Response.json(
        { error: `Tải nội dung nguồn thất bại: HTTP ${res.status}` },
        { status: 502 }
      );
    }
    return new Response(res.body, {
      headers: buildHeaders(res.headers.get("content-type") ?? "application/octet-stream"),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
