"use client";

import { toggleComparison, useComparisonSlugs } from "@/lib/comparison";

export function CompareButton({ slug, className = "", subtle = false }: { slug: string; className?: string; subtle?: boolean }) {
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
      className={`flex shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 transition-all duration-150 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 ${subtle ? "h-9 w-9 shadow-sm" : "h-11 w-11 shadow-md"} ${
        subtle ? active ? "bg-brand text-white" : "bg-white text-zinc-500 hover:text-brand" : active ? "bg-white text-accent" : "bg-accent text-white hover:bg-brand-dark"
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
