import Link from "next/link";
import type { CatalogNavNode } from "@/lib/catalog";

// Десктопная версия меню каталога — открывается и раскрывается по НАВЕДЕНИЮ
// мыши (как в обычных интернет-магазинах), а не по клику: навёл на
// "Каталог" — увидел категории, навёл на категорию (например "Телефоны") —
// сбоку открылся список брендов/линеек, навёл на бренд (например "Apple") —
// открылся список моделей. Клик работает только там, где он и должен вести
// куда-то: по названию категории/бренда — на страницу со всем ассортиментом
// этого раздела (у узла есть свой href), а по конкретной модели (лист без
// children) — сразу на страницу товара.
//
// На мобильных наведения нет (сенсорный экран), поэтому там остаётся
// прежнее меню на клик — полноэкранная панель, см. CatalogMenu.tsx.
//
// Важно про group/group-hover: у каждого УРОВНЯ вложенности — свой
// именованный Tailwind-group (l0/l1/l2/l3). Если бы все уровни делили одно
// и то же имя, наведение на любой пункт первого уровня "поднимало" бы
// hover-состояние до общего корня (CSS :hover распространяется на предков)
// и по ошибке открывало бы подменю СРАЗУ у всех соседних пунктов первого
// уровня одновременно. Разные имена на разных уровнях этого не допускают —
// hover считается только по ближайшему предку с тем же именем.

function BurgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
      <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

// Явные варианты классов на каждый уровень — Tailwind должен видеть
// написанные буквально имена классов в исходном тексте файла, поэтому
// собирать имя вида `group/l${depth}` на лету нельзя.
const LEVEL_GROUP: Record<number, string> = {
  1: "group/l1",
  2: "group/l2",
  3: "group/l3",
};
const LEVEL_PANEL_VISIBLE: Record<number, string> = {
  1: "invisible absolute left-full top-0 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2 opacity-0 shadow-xl transition-opacity duration-100 group-hover/l1:visible group-hover/l1:opacity-100",
  2: "invisible absolute left-full top-0 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2 opacity-0 shadow-xl transition-opacity duration-100 group-hover/l2:visible group-hover/l2:opacity-100",
  3: "invisible absolute left-full top-0 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2 opacity-0 shadow-xl transition-opacity duration-100 group-hover/l3:visible group-hover/l3:opacity-100",
};

function CatalogMenuNode({ node, depth }: { node: CatalogNavNode; depth: 1 | 2 | 3 }) {
  const hasChildren = Boolean(node.children?.length);

  const label = node.href ? (
    <Link
      href={node.href}
      className="flex flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-zinc-50 hover:text-accent"
    >
      <span>{node.label}</span>
      {hasChildren && <span className="text-zinc-400">›</span>}
    </Link>
  ) : (
    <span className="flex flex-1 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-foreground">
      {node.label}
      {hasChildren && <span className="text-zinc-400">›</span>}
    </span>
  );

  if (!hasChildren) {
    return <li>{label}</li>;
  }

  const nextDepth = depth < 3 ? ((depth + 1) as 2 | 3) : 3;

  return (
    <li className={`relative ${LEVEL_GROUP[depth]}`}>
      {label}
      <ul className={LEVEL_PANEL_VISIBLE[depth]}>
        {node.href && (
          <li>
            <Link
              href={node.href}
              className="mb-1 block rounded-lg px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-zinc-50"
            >
              Смотреть всё →
            </Link>
          </li>
        )}
        {node.children!.map((child) => (
          <CatalogMenuNode key={child.label} node={child} depth={nextDepth} />
        ))}
      </ul>
    </li>
  );
}

export function CatalogMenuDesktop({ tree }: { tree: CatalogNavNode[] }) {
  return (
    <div className="group/l0 relative">
      <Link
        href="/catalog"
        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:bg-accent hover:text-white"
      >
        <BurgerIcon />
        Каталог
      </Link>

      <ul className="invisible absolute left-0 top-full z-40 w-64 overflow-y-auto rounded-2xl border border-zinc-100 bg-white p-2 opacity-0 shadow-xl transition-opacity duration-100 group-hover/l0:visible group-hover/l0:opacity-100">
        {tree.map((node) => (
          <CatalogMenuNode key={node.label} node={node} depth={1} />
        ))}
      </ul>
    </div>
  );
}
