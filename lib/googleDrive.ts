import { createSign } from "node:crypto";

// Server-only. Reads a Google Drive folder using a Service Account
// (JWT Bearer OAuth flow, no external library — Node's built-in `crypto`
// can sign RS256 directly). Requires GOOGLE_SA_EMAIL + GOOGLE_SA_PRIVATE_KEY
// (see .env.example), and the folder must be shared with that service
// account's email at Viewer access or higher.

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

async function getAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_SA_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SA_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Thiếu GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY — xem .env.example.");
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(privateKey).toString("base64url");
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Lấy access token Google thất bại: ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export function extractFolderId(folderUrl: string): string {
  const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(`Không đọc được folder id từ URL: ${folderUrl}`);
  }
  return match[1];
}

export async function listDriveFolderFiles(folderId: string): Promise<DriveFile[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType)&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }
  );
  if (!res.ok) {
    throw new Error(`Liệt kê Drive folder thất bại: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.files ?? []) as DriveFile[];
}

// Only Google Docs (native) supported in this first version — the shared
// folder currently only contains that type. PDF/.docx would need adding
// pdf-parse/mammoth as new dependencies; deferred until actually needed
// rather than added speculatively.
export async function exportGoogleDocText(fileId: string): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000) }
  );
  if (!res.ok) {
    throw new Error(`Trích văn bản Google Doc thất bại: ${await res.text()}`);
  }
  return res.text();
}

const GOOGLE_NATIVE_MIME_PREFIX = "application/vnd.google-apps.";

// Used by app/api/drive-proxy/[bookSlug] — streams the ORIGINAL SOURCE
// DOCUMENT (a book's meta.sourceUrl), not a folder-listing file. Google
// Docs/Sheets/Slides don't have raw bytes to download (they're not files
// in the normal sense), so those get exported as PDF instead — which also
// conveniently means the browser's own built-in PDF viewer renders it, no
// Google-hosted preview UI (and its own drive.google.com sub-requests)
// involved at all.
export async function streamDriveFile(
  fileId: string
): Promise<{ contentType: string; body: ReadableStream<Uint8Array> }> {
  const token = await getAccessToken();

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }
  );
  if (!metaRes.ok) {
    throw new Error(`Đọc metadata file Drive thất bại: ${await metaRes.text()}`);
  }
  const { mimeType } = await metaRes.json();

  const isGoogleNative = typeof mimeType === "string" && mimeType.startsWith(GOOGLE_NATIVE_MIME_PREFIX);
  const url = isGoogleNative
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Tải nội dung file Drive thất bại: ${await res.text()}`);
  }

  return {
    contentType: isGoogleNative ? "application/pdf" : mimeType || "application/octet-stream",
    body: res.body,
  };
}
