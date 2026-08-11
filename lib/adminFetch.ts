"use client";

import { supabase } from "./supabaseClient";

// Attaches the current user's access token so server-side requireAdmin()
// (lib/adminAuth.ts) can verify identity — every admin page/component
// should call the API through this instead of plain fetch().
export async function adminFetch(input: string, init: RequestInit = {}) {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const token = session?.access_token;

  return fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
