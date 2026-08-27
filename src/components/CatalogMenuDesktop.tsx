"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogNavNode } from "@/lib/catalog";

// Десктопная версия меню каталога — каскад колонок на наведение, как у
// крупных магазинов электроники (например BigGeek): навёл на раздел —
// справа появилась колонка его содержимого, навёл на пункт в ней — ещё
// колонка правее, и так на любую глубину. Заложено с запасом: сейчас
// каталог небольшой, но должен вырасти, а эта схема не привязана к
// конкретному числу уровней (в отличие от прежней версии на CSS-хаках).
//
// Раньше здесь уже была ровно такая каскадная раскладка на чистом CSS
// (:hover), и она "съезжала" за правый край экрана — каждая колонка была
// отдельной всплывающей панелью без общего контейнера. Тут по-другому: все
// колонки живут ВНУТРИ одной панели ограниченной ширины (max-w-[92vw]) с
// горизонтальной прокруткой — если колонок наберётся больше, чем влезает на
// экран, появится полоса прокрутки внутри панели, а не обрезанный текст за
// краем окна. Раскрытие следующей колонки — через состояние (path), а не
// через CSS group-hover, поэтому глубина вложенности ничем не ограничена.
//
// На мобильных наведения нет (сенсорный экран), поэтому там остаётся
// прежнее меню на клик — полноэкранная панель с той же логикой колонок,
// см. CatalogMenu.tsx (эта версия писалась по его образцу).

function BurgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function CatalogMenuDesktop({ tree }: { tree: CatalogNavNode[] }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState<CatalogNavNode[]>([]);

  function closeAll() {
    setOpen(false);
    setPath([]);
  }

  // Наведение на пункт с дочерними элементами раскрывает следующую колонку;
  // если до этого была раскрыта более глубокая ветка — она обрезается
  // (slice), как в обычном каскадном меню.
  function handleHover(depth: number, node: CatalogNavNode) {
    if (!node.children || node.children.length === 0) return;
    setPath((prev) => [...prev.slice(0, depth), node]);
  }

  const columns: CatalogNavNode[][] = [tree, ...path.map((n) => n.children ?? [])];

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={closeAll}>
      <Link
        href="/catalog"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-accent hover:text-white"
      >
        <BurgerIcon />
        Каталог
      </Link>

      {open && tree.length > 0 && (
        <div className="absolute left-0 top-full z-50 flex max-w-[92vw] overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-xl">
          {columns.map((col, depth) => {
            // "Смотреть всё" вверху колонки — переход туда, откуда эта
            // колонка раскрылась (для первой колонки — весь каталог целиком).
            const viewAllHref = depth === 0 ? "/catalog" : path[depth - 1]?.href;

            return (
              <div
                key={depth}
                className="flex max-h-[70vh] w-56 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-zinc-100 p-2 last:border-r-0"
              >
                {viewAllHref && (
                  <Link
                    href={viewAllHref}
                    className="mb-1 block rounded-lg px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-zinc-50"
                  >
                    Смотреть всё →
                  </Link>
                )}

                {col.map((node) => {
                  const hasChildren = Boolean(node.children?.length);
                  const isActive = path[depth]?.label === node.label;
                  const itemClass = `flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-zinc-50 text-accent"
                      : "text-foreground hover:bg-zinc-50 hover:text-accent"
                  }`;
                  const content = (
                    <>
                      <span>{node.label}</span>
                      {hasChildren && <span className="text-zinc-400">›</span>}
                    </>
                  );

                  // Клик по названию раздела/бренда/модели — переход на его
                  // страницу; наведение отдельно раскрывает следующую
                  // колонку. Пункт без своего href (например, линейка без
                  // отдельной страницы) — просто раскрывает колонку, никуда
                  // не ведёт.
                  return node.href ? (
                    <Link
                      key={node.label}
                      href={node.href}
                      onMouseEnter={() => handleHover(depth, node)}
                      className={itemClass}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span
                      key={node.label}
                      onMouseEnter={() => handleHover(depth, node)}
                      className={itemClass}
                    >
                      {content}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
