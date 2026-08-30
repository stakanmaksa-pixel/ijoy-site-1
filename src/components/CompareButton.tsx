"use client";

import { toggleComparison, useComparisonSlugs } from "@/lib/comparison";

export function CompareButton({ slug, className = "" }: { slug: string; className?: string }) {
  const selected = useComparisonSlugs();
  const active = selected.includes(slug);
  const limitReached = !active && selected.length >= 3;

  return (
    <button
      type="button"
      disabled={limitReached}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleComparison(slug);
      }}
      aria-pressed={active}
      aria-label={active ? "Убрать из сравнения" : "Добавить к сравнению"}
      title={limitReached ? "В сравнении может быть до 3 моделей" : active ? "Убрать из сравнения" : "Сравнить"}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-black/5 transition-all duration-150 hover:scale-105 hover:bg-white active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 ${
        active ? "text-accent" : "text-zinc-500"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 4H4v4" />
        <path d="M4 4l5 5" />
        <path d="M16 20h4v-4" />
        <path d="M20 20l-5-5" />
        <path d="M16 4h4v4" />
        <path d="M20 4l-5 5" />
        <path d="M8 20H4v-4" />
        <path d="M4 20l5-5" />
      </svg>
    </button>
  );
}
