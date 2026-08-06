import type { SiteData, Book, Module } from "./types";
import siteData from "@/content/portal.json";

export function getSite(): SiteData {
  return siteData as SiteData;
}

export function getBooks(): Book[] {
  return getSite().books;
}

export function getBook(bookSlug: string): Book | undefined {
  return getBooks().find((b) => b.slug === bookSlug);
}

export function getModule(bookSlug: string, moduleSlug: string): Module | undefined {
  return getBook(bookSlug)?.modules.find((m) => m.id === moduleSlug);
}

export function getBookSlugs(): string[] {
  return getBooks().map((b) => b.slug);
}

export function getAllModuleParams(): { book: string; slug: string }[] {
  return getBooks().flatMap((b) => b.modules.map((m) => ({ book: b.slug, slug: m.id })));
}

export function getAdjacentModules(
  bookSlug: string,
  moduleSlug: string
): { prev: Module | null; next: Module | null } {
  const modules = getBook(bookSlug)?.modules ?? [];
  const index = modules.findIndex((m) => m.id === moduleSlug);
  return {
    prev: index > 0 ? modules[index - 1] : null,
    next: index >= 0 && index < modules.length - 1 ? modules[index + 1] : null,
  };
}
