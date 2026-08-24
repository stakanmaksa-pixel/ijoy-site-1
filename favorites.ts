"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ijoy:favorites";

type Listener = () => void;
const listeners = new Set<Listener>();

function readSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSlugs(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — избранное просто
    // не сохранится между визитами, страницу это не должно ломать.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  function onStorage(e: StorageEvent) {
    if (e.key === STORAGE_KEY) listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string {
  // useSyncExternalStore сравнивает снимки по ===, поэтому отдаём
  // сериализованную строку, а не новый массив при каждом вызове.
  return JSON.stringify(readSlugs());
}

function getServerSnapshot(): string {
  return "[]";
}

export function useFavoriteSlugs(): string[] {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return JSON.parse(snapshot);
}

export function useIsFavorite(slug: string): boolean {
  return useFavoriteSlugs().includes(slug);
}

export function toggleFavorite(slug: string) {
  const current = readSlugs();
  const next = current.includes(slug)
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  writeSlugs(next);
}
