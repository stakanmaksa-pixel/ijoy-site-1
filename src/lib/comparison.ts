"use client";

import { useSyncExternalStore } from "react";

// Сравнение относится к модели целиком, а не к конкретной памяти или цвету:
// покупателю важно сопоставить iPhone 17 Pro и iPhone 17 Pro Max, а не две
// модификации одного телефона. Выбранные слаги храним в браузере, как и
// избранное, поэтому выбор не пропадает при переходе между страницами.
const STORAGE_KEY = "ijoy:comparison:v1";
export const MAX_COMPARISON_ITEMS = 3;

type Listener = () => void;
const listeners = new Set<Listener>();

function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((slug): slug is string => typeof slug === "string").slice(0, MAX_COMPARISON_ITEMS)
      : [];
  } catch {
    return [];
  }
}

function writeSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // В приватном режиме сравнение просто не сохранится после закрытия вкладки.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return JSON.stringify(readSlugs());
}

export function useComparisonSlugs(): string[] {
  return JSON.parse(useSyncExternalStore(subscribe, getSnapshot, () => "[]"));
}

export function toggleComparison(slug: string) {
  const current = readSlugs();
  if (current.includes(slug)) {
    writeSlugs(current.filter((item) => item !== slug));
    return;
  }
  if (current.length >= MAX_COMPARISON_ITEMS) return;
  writeSlugs([...current, slug]);
}
