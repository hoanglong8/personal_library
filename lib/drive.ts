/**
 * Convert a Google Drive share/view link into an embeddable preview URL.
 * Accepts .../file/d/<id>/view..., .../file/d/<id>/edit..., or a bare id.
 * Returns null if no file id can be found — caller should skip embedding
 * rather than render a broken iframe.
 */
export function toDriveEmbedUrl(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/^([a-zA-Z0-9_-]{20,})$/);
  if (!match) return null;
  return `https://drive.google.com/file/d/${match[1]}/preview`;
}
