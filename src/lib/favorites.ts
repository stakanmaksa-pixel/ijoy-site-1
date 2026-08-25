"use client";

import { useSyncExternalStore } from "react";

// v2 — раньше избранное хранило слаги товаров (весь товар целиком), из-за
// чего избранная "чёрная 512ГБ" подсвечивала сердечко и на "розовой 256ГБ"
// того же телефона. Теперь храним id конкретных модификаций (ProductVariant),
// поэтому ключ хранилища намеренно новый — старые записи (по слагам) просто
// не подходят под этот формат и тихо игнорируются, ничего не ломая.
const STORAGE_KEY = "ijoy:favorites:v2";

type Listener = () => void;
const listeners = new Set<Listener>();

function readIds(): string[] {
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

function writeIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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
  return JSON.stringify(readIds());
}

function getServerSnapshot(): string {
  return "[]";
}

export function useFavoriteVariantIds(): string[] {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return JSON.parse(snapshot);
}

export function useIsFavorite(variantId: string): boolean {
  return useFavoriteVariantIds().includes(variantId);
}

export function toggleFavorite(variantId: string) {
  const current = readIds();
  const next = current.includes(variantId)
    ? current.filter((id) => id !== variantId)
    : [...current, variantId];
  writeIds(next);
}
