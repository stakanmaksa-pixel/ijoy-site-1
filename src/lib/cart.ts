"use client";

import { useSyncExternalStore } from "react";

export type CartLine = { variantId: string; quantity: number };

const STORAGE_KEY = "ijoy:cart:v1";
type Listener = () => void;
const listeners = new Set<Listener>();

function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line): line is CartLine =>
        Boolean(line) && typeof line.variantId === "string" && Number.isInteger(line.quantity) && line.quantity > 0,
      )
      .map((line) => ({ variantId: line.variantId, quantity: Math.min(line.quantity, 20) }));
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // В приватном режиме localStorage может быть недоступен. Корзина всё
    // равно будет работать до перезагрузки страницы благодаря listeners.
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
  return JSON.stringify(readCart());
}

export function useCart(): CartLine[] {
  return JSON.parse(useSyncExternalStore(subscribe, getSnapshot, () => "[]"));
}

export function addToCart(variantId: string) {
  const current = readCart();
  const existing = current.find((line) => line.variantId === variantId);
  if (existing) {
    writeCart(current.map((line) => line.variantId === variantId ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line));
  } else {
    writeCart([...current, { variantId, quantity: 1 }]);
  }
}

export function setCartQuantity(variantId: string, quantity: number) {
  const next = Math.max(0, Math.min(20, Math.floor(quantity)));
  writeCart(next === 0 ? readCart().filter((line) => line.variantId !== variantId) : readCart().map((line) => line.variantId === variantId ? { ...line, quantity: next } : line));
}

export function removeFromCart(variantId: string) {
  writeCart(readCart().filter((line) => line.variantId !== variantId));
}

export function clearCart() {
  writeCart([]);
}
