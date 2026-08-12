import { getBook } from "@/lib/content";
import { extractDriveFileId } from "@/lib/drive";
import { streamDriveFile } from "@/lib/googleDrive";

// Streams a book's original source document (meta.sourceUrl) through this
// route instead of embedding drive.google.com directly — the browser only
// ever talks to this domain; the actual Drive API call happens server-side
// and never shows up in the reader's Network tab. Public (no auth): "Xem
// bản gốc" has always been open to any reader, this route doesn't change
// that, only where the bytes come from.
export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookSlug: string }> }
) {
  const { bookSlug } = await params;

  const book = await getBook(bookSlug);
  if (!book?.meta.sourceUrl) {
    return Response.json({ error: "Sách này không có bản gốc." }, { status: 404 });
  }

  const fileId = extractDriveFileId(book.meta.sourceUrl);
  if (!fileId) {
    return Response.json({ error: "Không đọc được link Drive của sách này." }, { status: 400 });
  }

  try {
    const { contentType, body } = await streamDriveFile(fileId);
    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        // Browser-level cache only — the source document rarely changes
        // once ingested, and this avoids hitting the Drive API on every
        // single "Xem bản gốc" open. Not a server-side cache layer (no
        // Storage bucket involved) — deliberately simple for now.
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 502 });
  }
}
