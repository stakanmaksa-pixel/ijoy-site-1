import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../actions";
import { ProductForm } from "../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { price: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">{product.name}</h1>
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="text-sm text-red-500 hover:text-red-700">
            Удалить товар
          </button>
        </form>
      </div>

      <div className="mt-6 max-w-2xl">
        <ProductForm
          action={updateProduct}
          categories={categories}
          product={product}
          submitLabel="Сохранить"
        />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900">Модификации</h2>

        <div className="mt-4 flex flex-col gap-3">
          {product.variants.map((v) => (
            <form
              key={v.id}
              action={updateVariant}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-[1fr_1fr_1fr_1fr_100px_auto_auto] sm:items-center"
            >
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="productId" value={product.id} />
              <input
                name="memory"
                defaultValue={v.memory ?? ""}
                placeholder="Память"
                className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
              />
              <input
                name="color"
                defaultValue={v.color ?? ""}
                placeholder="Цвет"
                className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
              />
              <input
                name="region"
                defaultValue={v.region ?? ""}
                placeholder="Регион"
                className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
              />
              <input
                name="sku"
                defaultValue={v.sku ?? ""}
                placeholder="SKU"
                className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
              />
              <input
                required
                name="price"
                type="number"
                step="1"
                defaultValue={v.price != null ? Number(v.price) : ""}
                placeholder="Цена"
                className="rounded-lg border border-zinc-300 px-2 py-2 text-sm"
              />
              <label className="flex items-center gap-1 text-xs text-zinc-600">
                <input type="checkbox" name="inStock" defaultChecked={v.inStock} />
                в наличии
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
                >
                  Сохранить
                </button>
              </div>
            </form>
          ))}

          {product.variants.map((v) => (
            <form key={`del-${v.id}`} action={deleteVariant} className="-mt-2 flex justify-end">
              <input type="hidden" name="id" value={v.id} />
              <input type="hidden" name="productId" value={product.id} />
              <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                Удалить модификацию ({[v.memory, v.color, v.region].filter(Boolean).join(" · ") || "без атрибутов"}, {v.price != null ? formatPrice(Number(v.price)) : "цена не указана"})
              </button>
            </form>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-4">
          <h3 className="text-sm font-medium text-zinc-900">Добавить модификацию</h3>
          <form
            action={createVariant}
            className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_100px_auto_auto] sm:items-center"
          >
            <input type="hidden" name="productId" value={product.id} />
            <input name="memory" placeholder="Память" className="rounded-lg border border-zinc-300 px-2 py-2 text-sm" />
            <input name="color" placeholder="Цвет" className="rounded-lg border border-zinc-300 px-2 py-2 text-sm" />
            <input name="region" placeholder="Регион" className="rounded-lg border border-zinc-300 px-2 py-2 text-sm" />
            <input name="sku" placeholder="SKU" className="rounded-lg border border-zinc-300 px-2 py-2 text-sm" />
            <input required name="price" type="number" step="1" placeholder="Цена" className="rounded-lg border border-zinc-300 px-2 py-2 text-sm" />
            <label className="flex items-center gap-1 text-xs text-zinc-600">
              <input type="checkbox" name="inStock" defaultChecked />
              в наличии
            </label>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
            >
              Добавить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
