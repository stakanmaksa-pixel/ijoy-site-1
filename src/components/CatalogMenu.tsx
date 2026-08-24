"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogNavNode } from "@/lib/catalog";

// Многоуровневое меню каталога (как в STORE77): клик по пункту с
// подкатегориями открывает следующую колонку справа, клик по конкретной
// модели сразу ведёт на страницу товара. Работает одинаково на мобильном
// (бургер, полноэкранная панель) и на десктопе (панель под шапкой).

function BurgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function CatalogMenu({ tree }: { tree: CatalogNavNode[] }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<CatalogNavNode[]>([]);

  function close() {
    setOpen(false);
    setPath([]);
  }

  function handlePick(depth: number, node: CatalogNavNode) {
    if (node.children && node.children.length > 0) {
      setPath((prev) => [...prev.slice(0, depth), node]);
    } else {
      close();
    }
  }

  const columns: CatalogNavNode[][] = [tree, ...path.map((n) => n.children ?? [])];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-accent hover:text-white"
      >
        <BurgerIcon />
        Каталог
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="relative flex h-full w-full flex-col bg-white shadow-xl sm:mx-auto sm:mt-16 sm:h-auto sm:max-h-[80vh] sm:max-w-4xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="font-display text-sm font-semibold text-foreground">
                Каталог
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Закрыть меню"
                className="text-xl leading-none text-zinc-400 transition-colors hover:text-accent"
              >
                ×
              </button>
            </div>

            <div className="flex flex-1 overflow-x-auto overflow-y-hidden">
              {columns.map((col, depth) => {
                const viewAllHref = depth === 0 ? "/catalog" : path[depth - 1]?.href;
                return (
                  <div
                    key={depth}
                    className="flex w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-zinc-100 p-2 last:border-r-0"
                  >
                    {viewAllHref && (
                      <Link
                        href={viewAllHref}
                        onClick={close}
                        className="mb-1 rounded-lg px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-zinc-50"
                      >
                        Смотреть всё →
                      </Link>
                    )}
                    {col.map((node) => {
                      const isActive = path[depth]?.label === node.label;
                      const hasChildren = Boolean(node.children?.length);

                      if (hasChildren) {
                        return (
                          <button
                            key={node.label}
                            type="button"
                            onClick={() => handlePick(depth, node)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? "bg-brand text-white"
                                : "text-foreground hover:bg-zinc-50 hover:text-accent"
                            }`}
                          >
                            <span>{node.label}</span>
                            <span className="ml-2">›</span>
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={node.label}
                          href={node.href ?? "/catalog"}
                          onClick={close}
                          className="rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-zinc-50 hover:text-accent"
                        >
                          {node.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
