import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликован",
  HIDDEN: "Скрыт",
};

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Товары</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
        >
          + Новый товар
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-4">Название</th>
              <th className="py-2 pr-4">Категория</th>
              <th className="py-2 pr-4">Статус</th>
              <th className="py-2 pr-4">Модификаций</th>
              <th className="py-2 pr-4">Цена от</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const prices = p.variants
                .filter((v) => v.price !== null)
                .map((v) => Number(v.price));
              const minPrice = prices.length > 0 ? Math.min(...prices) : null;
              return (
                <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="py-2 pr-4">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-zinc-900 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-zinc-600">{p.category.name}</td>
                  <td className="py-2 pr-4 text-zinc-600">{STATUS_LABEL[p.status] ?? p.status}</td>
                  <td className="py-2 pr-4 text-zinc-600">{p.variants.length}</td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {minPrice != null ? formatPrice(minPrice) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <p className="mt-4 text-sm text-zinc-500">Товаров пока нет.</p>
        )}
      </div>
    </div>
  );
}
