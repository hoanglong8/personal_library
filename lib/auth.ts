"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

// Module-level singleton session state, shared by every component calling
// useSession() — same "one store, many subscribers" shape as ThemeToggle's
// useSyncExternalStore, but backed by Supabase's onAuthStateChange instead
// of a DOM event. Magic-link only (no password), matching the Supabase
// project setting the user enables in the dashboard (Authentication ->
// Providers -> Email -> Magic Link).
let currentSession: Session | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function ensureInitialized() {
  if (initialized || !supabase) return;
  initialized = true;

  supabase.auth.getSession().then(({ data }) => {
    currentSession = data.session;
    notify();
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    currentSession = session;
    notify();
  });
}

function subscribe(callback: () => void) {
  ensureInitialized();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return currentSession;
}

function getServerSnapshot() {
  return null;
}

/** null while unauthenticated OR before the initial session check resolves. */
export function useSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export async function signInWithMagicLink(email: string) {
  if (!supabase) throw new Error("Supabase chưa được cấu hình.");
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export { isSupabaseConfigured };
