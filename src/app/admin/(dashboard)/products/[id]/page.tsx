import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
  uploadProductImage,
  deleteProductImage,
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

  // Цвета берём из реальных модификаций товара — так список фото-групп
  // сам следует за тем, что заведено в "Модификациях" выше, без ручной
  // синхронизации.
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter((c): c is string => Boolean(c))),
  );
  const colorImages = (product.colorImages as Record<string, string[]> | null) ?? {};

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

      <div className="mt-10">
        <h2 className="text-lg font-medium text-zinc-900">Фото</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Для каждого цвета — свои фото: на странице товара они переключаются
          вместе с выбором цвета, чтобы сразу было видно, какой цвет
          покупатель получит.
        </p>

        <div className="mt-4 flex flex-col gap-6">
          {colors.map((color) => (
            <PhotoGroup
              key={color}
              title={color}
              productId={product.id}
              slug={product.slug}
              color={color}
              images={colorImages[color] ?? []}
            />
          ))}

          <PhotoGroup
            title={colors.length > 0 ? "Общие фото (без привязки к цвету)" : "Фото"}
            productId={product.id}
            slug={product.slug}
            color=""
            images={product.images}
          />
        </div>
      </div>
    </div>
  );
}

function PhotoGroup({
  title,
  productId,
  slug,
  color,
  images,
}: {
  title: string;
  productId: string;
  slug: string;
  color: string;
  images: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <h3 className="text-sm font-medium text-zinc-900">{title}</h3>

      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {images.map((url) => (
            <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-200">
              {/* Обычный img — фото свои, локальные, next/image тут не даёт выгоды */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <form action={deleteProductImage} className="absolute right-1 top-1">
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="color" value={color} />
                <input type="hidden" name="url" value={url} />
                <button
                  type="submit"
                  aria-label="Удалить фото"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white hover:bg-red-600"
                >
                  ×
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form action={uploadProductImage} encType="multipart/form-data" className="mt-3 flex items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="color" value={color} />
        <input
          required
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-xs text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-xs file:font-medium hover:file:bg-zinc-200"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
        >
          Загрузить
        </button>
      </form>
    </div>
  );
}
