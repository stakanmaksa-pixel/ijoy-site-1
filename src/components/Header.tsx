import Link from "next/link";
import { NAV_LINKS } from "@/lib/nav";
import { CONTACTS } from "@/lib/contacts";
import { getCatalogNavTree } from "@/lib/catalog";
import { CatalogMenu } from "@/components/CatalogMenu";
import { Logo } from "@/components/Logo";

// Заливка фона на ховере вместо простой смены цвета текста — так проще
// заметить, какой пункт меню сейчас под курсором (раньше было заметно
// «еле-еле»).
const NAV_LINK_CLASS =
  "rounded-full px-3 py-1.5 transition-colors hover:bg-accent hover:text-white";

export async function Header() {
  // Если БД на секунду недоступна — не роняем всю страницу, а просто
  // показываем меню каталога пустым (кнопка "Каталог" останется, но без
  // содержимого); в норме здесь всегда реальный список категорий.
  const catalogTree = await getCatalogNavTree().catch(() => []);

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Logo />

        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm text-zinc-700 md:flex">
          <CatalogMenu tree={catalogTree} />
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </nav>

        <a
          href={CONTACTS.phoneHref}
          className="whitespace-nowrap rounded-full bg-brand px-4 py-2 font-display text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Позвонить
        </a>
      </div>

      {/* Мобильная навигация */}
      <nav className="flex flex-wrap items-center gap-1 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-700 md:hidden">
        <CatalogMenu tree={catalogTree} />
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={NAV_LINK_CLASS}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
