"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener("portal-theme-change", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener("portal-theme-change", callback);
  };
}

function getSnapshot(): Theme {
  const stored = window.localStorage.getItem("portal-theme") as Theme | null;
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function setTheme(theme: Theme) {
  window.localStorage.setItem("portal-theme", theme);
  window.dispatchEvent(new Event("portal-theme-change"));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Đổi giao diện sáng/tối"
      className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft hover:border-accent hover:text-accent transition-colors"
    >
      {theme === "dark" ? "☀ Sáng" : "● Tối"}
    </button>
  );
}
