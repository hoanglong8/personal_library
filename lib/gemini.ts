// Thin server-only wrapper around the Gemini (Generative Language API)
// REST endpoint — plain fetch, no SDK dependency, matching how the rest of
// this project avoids adding heavy client libraries for a single call
// shape. Only ever called from admin Route Handlers (never from a Client
// Component: GEMINI_API_KEY has no NEXT_PUBLIC_ prefix on purpose).

// "gemini-2.5-flash" (a specific pinned version) returns 404 "no longer
// available to new users" for keys created after Google deprecated it —
// confirmed by testing against this project's actual key. "-latest" is a
// rolling alias Google keeps pointed at their current recommended flash
// model, so it stays valid without code changes as models get deprecated.
const DEFAULT_MODEL = "gemini-flash-latest";

// Gemini's `responseSchema` is a constrained subset of OpenAPI 3.0 Schema
// Object (no `$ref`, no `oneOf`/`anyOf` on the root, etc.) — typed loosely
// here since callers build these by hand per job type.
export type GeminiSchema = Record<string, unknown>;

export async function generateStructured<T>(params: {
  prompt: string;
  schema: GeminiSchema;
}): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình — xem .env.example.");
  }
  const model = process.env.GEMINI_MODEL_ID || DEFAULT_MODEL;

  // A production ingest job once hung well past its 60s route maxDuration
  // and got killed by Vercel's own gateway (504) with the DB row stuck at
  // status='processing' forever — an isolated timing test afterward showed
  // the same call normally takes ~16s, so the hang was likely a one-off
  // slow/stuck upstream response, not a systemic latency issue. Bounding
  // the fetch itself means a slow response fails fast with a clear error
  // instead of silently consuming the whole route budget.
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: params.schema,
        },
      }),
      signal: AbortSignal.timeout(45_000),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API lỗi (HTTP ${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error(`Gemini không trả về nội dung hợp lệ: ${JSON.stringify(data)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Gemini trả về JSON không parse được: ${text}`);
  }
}
