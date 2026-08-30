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
      className={`flex h-11 w-11 items-center justify-center rounded-full shadow-md ring-1 ring-black/5 transition-all duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 ${
        active ? "bg-white text-accent" : "bg-accent text-white hover:bg-brand-dark"
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16" />
        <path d="M5 7h14" />
        <path d="m5 7-3 6h6L5 7Z" />
        <path d="m19 7-3 6h6l-3-6Z" />
        <path d="M8 20h8" />
      </svg>
    </button>
  );
}
