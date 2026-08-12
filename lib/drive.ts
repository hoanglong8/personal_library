/**
 * Extract a Google Drive file id from a share/view link.
 * Accepts .../file/d/<id>/view..., .../file/d/<id>/edit..., or a bare id.
 * Returns null if no file id can be found — caller should skip embedding
 * rather than render a broken iframe.
 */
export function extractDriveFileId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/^([a-zA-Z0-9_-]{20,})$/);
  return match ? match[1] : null;
}
