"use client";

import Link from "next/link";
import { useState } from "react";
import type { CatalogNavNode } from "@/lib/catalog";

// Десктопная версия меню каталога, в духе STORE77: одна большая панель на
// наведение, а не каскад из мелких выпадашек. Слева — список всех разделов
// (Телефоны, Часы, Планшеты...), справа — сразу ВСЁ содержимое выбранного
// раздела (бренды/линейки и конкретные модели), без дополнительных наведений
// и без горизontальных полосок прокрутки у каждой колонки.
//
// Раньше здесь была версия с вложенными flyout-панелями (свой поповер на
// каждый уровень вложенности) — на деле она "съезжала" за правый край экрана
// и обрубала текст, если разделов/уровней было много. Эта версия — один
// панель фиксированной ширины, которая гарантированно помещается на экране.
//
// На мобильных наведения нет (сенсорный экран), поэтому там остаётся
// прежнее меню на клик — полноэкранная панель, см. CatalogMenu.tsx.

function BurgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function RightPane({ node }: { node: CatalogNavNode | undefined }) {
  if (!node) return null;

  const children = node.children ?? [];

  // Раздел из одного товара (например, "Дайсоны" с единственной моделью в
  // прайсе) — children нет вообще, ведём прямо на товар.
  if (children.length === 0) {
    return (
      <Link
        href={node.href ?? "/catalog"}
        className="inline-block rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-white"
      >
        Смотреть {node.label.toLowerCase()} →
      </Link>
    );
  }

  const isGrouped = children.some((c) => Boolean(c.children?.length));

  if (!isGrouped) {
    // Плоский раздел (Часы, Планшеты, Ноутбуки): просто список моделей,
    // разложенный в несколько колонок, как на STORE77 — весь раздел виден
    // сразу, без дополнительных наведений.
    return (
      <div className="columns-2 gap-x-8 lg:columns-3">
        {children.map((leaf) => (
          <Link
            key={leaf.label}
            href={leaf.href ?? "/catalog"}
            className="block break-inside-avoid rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-zinc-50 hover:text-accent"
          >
            {leaf.label}
          </Link>
        ))}
      </div>
    );
  }

  // Раздел с линейками (Телефоны: Apple iPhone / Samsung Galaxy;
  // Аксессуары: AirPods / Apple TV) — каждая линейка своим блоком колонок.
  // Заголовок линейки ("Apple iPhone"/"Samsung Galaxy") намеренно не
  // показываем: и так понятно по названиям моделей ниже (везде написано
  // "iPhone ..." / "Samsung Galaxy ..."), а лишний текст просто занимал
  // место.
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {children.map((group) => (
        <div key={group.label} className="columns-2 gap-x-6">
          {(group.children ?? []).map((leaf) => (
            <Link
              key={leaf.label}
              href={leaf.href ?? "/catalog"}
              className="block break-inside-avoid rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-zinc-50 hover:text-accent"
            >
              {leaf.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CatalogMenuDesktop({ tree }: { tree: CatalogNavNode[] }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeNode = tree[activeIndex] ?? tree[0];

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href="/catalog"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-accent hover:text-white"
      >
        <BurgerIcon />
        Каталог
      </Link>

      {open && tree.length > 0 && (
        <div className="absolute left-0 top-full z-50 flex w-[min(92vw,760px)] overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-xl">
          <div className="flex w-52 shrink-0 flex-col gap-0.5 border-r border-zinc-100 bg-zinc-50/60 p-2">
            {tree.map((node, i) => (
              <Link
                key={node.label}
                href={node.href ?? "/catalog"}
                onMouseEnter={() => setActiveIndex(i)}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-brand text-white"
                    : "text-foreground hover:bg-white hover:text-accent"
                }`}
              >
                {node.label}
              </Link>
            ))}
          </div>

          <div className="max-h-[65vh] flex-1 overflow-y-auto p-5">
            <RightPane node={activeNode} />
          </div>
        </div>
      )}
    </div>
  );
}
