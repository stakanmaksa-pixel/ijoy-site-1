import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";
import { CONTACTS } from "@/lib/contacts";
import { getCatalogNavTree } from "@/lib/catalog";
import { CatalogMenu } from "@/components/CatalogMenu";
import { CatalogMenuDesktop } from "@/components/CatalogMenuDesktop";
import { Logo } from "@/components/Logo";
import { CartLink } from "@/components/CartLink";
import { HeaderQuickLinks } from "@/components/HeaderQuickLinks";

// Заливка фона на ховере вместо простой смены цвета текста — так проще
// заметить, какой пункт меню сейчас под курсором (раньше было заметно
// «еле-еле»).
const NAV_LINK_CLASS =
  "whitespace-nowrap rounded-full px-2 py-1.5 transition-colors hover:bg-accent hover:text-white xl:px-3";

export async function Header() {
  // Если БД на секунду недоступна — не роняем всю страницу, а просто
  // показываем меню каталога пустым (кнопка "Каталог" останется, но без
  // содержимого); в норме здесь всегда реальный список категорий.
  const catalogTree = await getCatalogNavTree().catch(() => []);

  return (
    // sticky top-0 — шапка теперь всегда видна при прокрутке (не только в
    // начале страницы). z-50, чтобы быть выше остального контента; scroll-pt
    // на <html> (layout.tsx) компенсирует высоту шапки, чтобы блоки со
    // scroll-snap не оказывались наполовину под ней при "прилипании".
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-4 sm:px-6 xl:gap-5">
        <Logo />

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0 text-[13px] text-zinc-700 xl:gap-1 xl:text-sm lg:flex">
          {/* Десктоп — меню каталога открывается по наведению (см.
              CatalogMenuDesktop.tsx). На мобильном наведения нет, там ниже
              остаётся прежнее меню на клик (CatalogMenu.tsx). */}
          <CatalogMenuDesktop tree={catalogTree} />
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderQuickLinks />
          <div className="hidden sm:block"><CartLink /></div>
          <a href={CONTACTS.phoneHref} className="whitespace-nowrap rounded-full bg-brand px-4 py-2 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark">Позвонить</a>
        </div>
      </div>

      {/* Поиск по каталогу — обычная GET-форма без JS, ведёт на /catalog?q=...
          (там же живут фильтры по категории/бренду/цене, поиск — ещё один
          такой же параметр, см. getPublishedProducts в catalog.ts). */}
      <div className="border-t border-zinc-100 px-4 py-2.5 sm:px-6">
        <form action="/catalog" method="get" className="mx-auto flex max-w-[1440px] items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Искать телефон, часы, планшет…"
              className="w-full rounded-full border border-zinc-300 py-2 pl-10 pr-4 text-sm text-zinc-700 focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="whitespace-nowrap rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-accent hover:text-white"
          >
            Найти
          </button>
        </form>
      </div>

      {/* Мобильная навигация */}
      <nav className="flex flex-wrap items-center gap-1 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 lg:hidden">
        <CatalogMenu tree={catalogTree} />
        <HeaderQuickLinks className="flex items-center gap-2" />
        <CartLink />
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
