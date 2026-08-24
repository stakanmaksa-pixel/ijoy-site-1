import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [productCount, categoryCount, articleCount, newOrderCount, pendingImportCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.article.count(),
    prisma.order.count({ where: { status: "NEW" } }),
    prisma.priceImportBatch.count({ where: { status: { in: ["PENDING", "PARTIALLY_APPLIED"] } } }),
  ]);

  const tiles = [
    { label: "Товары", value: productCount, href: "/admin/products" },
    { label: "Категории", value: categoryCount, href: "/admin/categories" },
    { label: "Статьи блога", value: articleCount, href: "/admin/articles" },
    { label: "Новые заявки", value: newOrderCount, href: "/admin/orders" },
    { label: "Прайсы на проверке", value: pendingImportCount, href: "/admin/price-import" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-zinc-900">Обзор</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="rounded-2xl border border-zinc-200 p-4 transition-colors hover:border-zinc-900"
          >
            <div className="text-2xl font-semibold text-zinc-900">{tile.value}</div>
            <div className="mt-1 text-sm text-zinc-500">{tile.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
