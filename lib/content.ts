import type { Portal, Module } from "./types";
import portalData from "@/content/portal.json";

export function getPortal(): Portal {
  return portalData as Portal;
}

export function getModule(slug: string): Module | undefined {
  return getPortal().modules.find((m) => m.id === slug);
}

export function getModuleSlugs(): string[] {
  return getPortal().modules.map((m) => m.id);
}

export function getAdjacentModules(slug: string): {
  prev: Module | null;
  next: Module | null;
} {
  const modules = getPortal().modules;
  const index = modules.findIndex((m) => m.id === slug);
  return {
    prev: index > 0 ? modules[index - 1] : null,
    next: index >= 0 && index < modules.length - 1 ? modules[index + 1] : null,
  };
}
