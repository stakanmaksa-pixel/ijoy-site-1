import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { logoutAction } from "@/app/admin/actions";

const ADMIN_NAV = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/articles", label: "Блог" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/price-import", label: "Импорт прайса" },
] as const;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <aside className="w-48 shrink-0">
        <div className="mb-6 text-sm text-zinc-400">
          Вы вошли как <span className="text-zinc-700">{admin.login}</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="mt-6">
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:text-zinc-900"
          >
            Выйти
          </button>
        </form>
      </aside>

      {/* div, а не <main> — на странице уже есть один <main> из корневого layout,
          вложенные <main> невалидны и путают инструменты доступности/автотесты */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
