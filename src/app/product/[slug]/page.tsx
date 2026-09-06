import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductsBySlugs } from "@/lib/catalog";
import { pickVariantImages } from "@/lib/pickCoverImage";
import { ProductDetail } from "@/components/ProductDetail";
import { VariantGrid } from "@/components/VariantGrid";
import { ProductCard } from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name };
}

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const variantId = toSingle(sp.variant);

  const [product, compatibleAccessories] = await Promise.all([
    getProductBySlug(slug),
    ["ipad-pro-11-m5", "ipad-pro-13-m5"].includes(slug)
      ? getProductsBySlugs(["apple-pencil-pro"])
      : Promise.resolve([]),
  ]);

  if (!product) {
    notFound();
  }

  const selectedVariant = variantId
    ? product.variants.find((v) => v.id === variantId)
    : undefined;

  // У модели несколько модификаций (память/цвет/регион), и конкретная ещё
  // не выбрана — сначала показываем список всех модификаций отдельными
  // карточками (как в каталоге), а не сразу форму заказа с переключателем.
  // Клик по карточке ведёт на ?variant=<id> — уже конкретное устройство в
  // конкретной памяти и цвете.
  const showVariantGrid = product.variants.length > 1 && !selectedVariant;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/catalog" className="hover:text-accent">
          Каталог
        </Link>{" "}
        /{" "}
        <Link
          href={`/catalog?category=${product.categorySlug}`}
          className="hover:text-accent"
        >
          {product.categoryName}
        </Link>
        {!showVariantGrid && product.variants.length > 1 && (
          <>
            {" "}
            /{" "}
            <Link href={`/product/${slug}`} className="hover:text-accent">
              {product.name}
            </Link>
          </>
        )}
      </nav>

      {showVariantGrid ? (
        <>
          {product.brand && (
            <div className="text-sm font-medium uppercase tracking-wide text-accent">
              {product.brand}
            </div>
          )}
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-foreground">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
              {product.description}
            </p>
          )}

          <VariantGrid
            slug={slug}
            variants={product.variants}
            imageByVariant={Object.fromEntries(
              product.variants.map((variant) => [
                variant.id,
                pickVariantImages(product.images, product.colorImages, variant)[0] ?? null,
              ]),
            )}
          />
        </>
      ) : (
        <ProductDetail
          productName={product.name}
          productSlug={product.slug}
          brand={product.brand}
          description={product.description}
          variants={product.variants}
          initialVariantId={selectedVariant?.id}
          specs={product.specs}
          highlights={product.highlights}
          previousGenLabel={product.previousGenLabel}
          previousGenHighlights={product.previousGenHighlights}
          images={product.images}
          colorImages={product.colorImages}
        />
      )}

      {compatibleAccessories.length > 0 && (
        <section className="mt-16 border-t border-zinc-100 pt-10">
          <div className="max-w-2xl">
            <div className="text-sm font-medium uppercase tracking-wide text-accent">Совместимый аксессуар</div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">Купите в комплект Apple Pencil Pro</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Apple Pencil Pro полностью совместим с этой моделью iPad Pro M5: поддерживаются наведение,
              чувствительность к нажатию и наклону, сжатие, вращение пера и магнитная зарядка. Стилус продаётся отдельно.
            </p>
          </div>
          <div className="mt-6 w-full max-w-[280px]">
            {compatibleAccessories.map((accessory) => (
              <ProductCard
                key={accessory.slug}
                name={accessory.name}
                slug={accessory.slug}
                brand={accessory.brand}
                minPrice={accessory.minPrice}
                hasStock={accessory.hasStock}
                defaultVariantId={accessory.defaultVariantId}
                coverImage={accessory.coverImage}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
