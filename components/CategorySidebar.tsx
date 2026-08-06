"use client";

import type { CategoryDomain } from "@/lib/categories";

export default function CategorySidebar({
  tree,
  countByDomain,
  countByField,
  selectedDomain,
  selectedField,
  onSelectDomain,
  onSelectField,
}: {
  tree: CategoryDomain[];
  countByDomain: Record<string, number>;
  countByField: Record<string, number>;
  selectedDomain: string | null;
  selectedField: string | null;
  onSelectDomain: (id: string | null) => void;
  onSelectField: (id: string | null) => void;
}) {
  return (
    <aside className="mb-8 lg:mb-0 lg:w-64 lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
      <h2 className="font-mono text-xs uppercase tracking-widest text-paper-400">
        Chủ đề
      </h2>
      <nav className="mt-3 space-y-3">
        <button
          type="button"
          onClick={() => {
            onSelectDomain(null);
            onSelectField(null);
          }}
          className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
            !selectedDomain
              ? "bg-accent-soft font-medium text-accent"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Tất cả chủ đề
        </button>

        {tree.map((domain) => {
          const isActiveDomain = selectedDomain === domain.id;
          return (
            <div key={domain.id}>
              <button
                type="button"
                onClick={() => {
                  onSelectDomain(isActiveDomain ? null : domain.id);
                  onSelectField(null);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors ${
                  isActiveDomain ? "bg-accent-soft text-accent" : "text-ink hover:text-accent"
                }`}
              >
                <span>{domain.label}</span>
                <span className="font-mono text-xs text-paper-400">
                  {countByDomain[domain.id] ?? 0}
                </span>
              </button>
              <div className="mt-1 space-y-0.5 border-l border-border pl-3">
                {domain.fields.map((field) => {
                  const active = selectedField === field.id;
                  return (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => {
                        onSelectDomain(domain.id);
                        onSelectField(active ? null : field.id);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs transition-colors ${
                        active ? "font-medium text-accent" : "text-paper-400 hover:text-ink"
                      }`}
                    >
                      <span>{field.label}</span>
                      <span className="font-mono">{countByField[field.id] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
