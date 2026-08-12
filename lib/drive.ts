/**
 * Extract a Google file id from a share/view link — covers plain Drive
 * files (/file/d/) as well as Docs/Sheets/Slides, which live under their
 * own domains/paths but are really just Drive files underneath and
 * resolve fine through the same Drive API (files.get / files.export) once
 * shared "Anyone with the link". Accepts a bare id too. Returns null if no
 * id can be found — caller should treat the URL as a non-Google source
 * instead (see app/api/drive-proxy/[bookSlug]/route.ts).
 */
export function extractDriveFileId(url: string): string | null {
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ??
    url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/) ??
    url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/) ??
    url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/) ??
    url.match(/^([a-zA-Z0-9_-]{20,})$/);
  return match ? match[1] : null;
}
