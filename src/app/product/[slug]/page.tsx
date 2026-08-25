import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/catalog";
import { ProductDetail } from "@/components/ProductDetail";
import { VariantCard } from "@/components/VariantCard";

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

  const product = await getProductBySlug(slug);

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

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.variants.map((v) => (
              <VariantCard key={v.id} slug={slug} variant={v} />
            ))}
          </div>
        </>
      ) : (
        <ProductDetail
          productName={product.name}
          brand={product.brand}
          description={product.description}
          variants={product.variants}
          initialVariantId={selectedVariant?.id}
        />
      )}
    </div>
  );
}
