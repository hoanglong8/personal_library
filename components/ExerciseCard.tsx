"use client";

import { useState } from "react";
import type { ExerciseSection } from "@/lib/types";

export default function ExerciseCard({ section }: { section: ExerciseSection }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-xl border border-dashed border-accent/60 bg-accent-soft/40 p-6">
      <span className="font-mono text-xs uppercase tracking-widest text-accent">
        Bài tập thực hành
      </span>
      <h3 className="mt-1.5 text-xl font-medium text-ink">{section.title}</h3>
      <p className="mt-3 text-sm text-ink-soft leading-relaxed">
        {section.prompt}
      </p>

      {(section.hint || section.answer) && (
        <div className="mt-4">
          <button
            onClick={() => setRevealed((r) => !r)}
            className="text-xs font-medium text-accent hover:underline"
          >
            {revealed ? "Ẩn gợi ý / đáp án" : "Xem gợi ý / đáp án"}
          </button>
          {revealed && (
            <div className="mt-3 space-y-2 rounded-lg bg-surface p-4 text-sm text-ink-soft">
              {section.hint && (
                <p>
                  <span className="font-medium text-ink">Gợi ý: </span>
                  {section.hint}
                </p>
              )}
              {section.answer && (
                <p>
                  <span className="font-medium text-ink">Đáp án tham khảo: </span>
                  {section.answer}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
