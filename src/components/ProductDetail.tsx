"use client";

import { useState } from "react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CompareButton } from "@/components/CompareButton";
import { ProductOrder } from "@/components/ProductOrder";
import { pickVariantImages } from "@/lib/pickCoverImage";
import { groupProductSpecs } from "@/lib/productSpecs";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  price: number | null;
  inStock: boolean;
};

// Правая колонка (ProductOrder) сама переключает память/цвет/регион у себя
// внутри — фото с сердечком избранного лежит в левой колонке, отдельным
// компонентом. Чтобы сердечко всегда относилось к реально выбранной сейчас
// модификации (а не просто к товару), оба блока живут в одном клиентском
// компоненте: ProductOrder сообщает сюда id выбранной модификации через
// onSelectedVariantChange, а он идёт в FavoriteButton.
export function ProductDetail({
  productName,
  productSlug,
  brand,
  description,
  variants,
  initialVariantId,
  specs,
  highlights,
  previousGenLabel,
  previousGenHighlights,
  images,
  colorImages,
}: {
  productName: string;
  productSlug: string;
  brand?: string | null;
  description?: string | null;
  variants: Variant[];
  initialVariantId?: string;
  specs?: Record<string, string> | null;
  highlights?: string[] | null;
  previousGenLabel?: string | null;
  previousGenHighlights?: string[] | null;
  // Общие фото товара (без привязки к цвету) — используются, если для
  // выбранного сейчас цвета своих фото ещё не загрузили.
  images?: string[] | null;
  // Фото по цветам — { "Титановый чёрный": ["/uploads/...", ...] }. Именно
  // они и решают запрос "по фото должно быть понятно, какой цвет" — при
  // выборе цвета ниже (в ProductOrder) галерея переключается на его фото.
  colorImages?: Record<string, string[]> | null;
}) {
  const initial =
    (initialVariantId && variants.find((v) => v.id === initialVariantId)) ||
    variants.find((v) => v.inStock) ||
    variants[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(initial?.id);

  const selectedVariant = variants.find((v) => v.id === selectedId);
  const activeColor = selectedVariant?.color ?? null;
  // Сначала ищем фотографию точной модификации (корпус + ремешок + размер),
  // затем фото цвета корпуса и только потом общее фото товара.
  const galleryImages = pickVariantImages(images ?? [], colorImages ?? null, selectedVariant);
  // Храним URL, а не индекс: при переключении цвета старый URL отсутствует
  // в новом наборе, поэтому автоматически берётся первое фото нового цвета
  // без дополнительного setState внутри effect.
  const [selectedImage, setSelectedImage] = useState<string | undefined>();
  const activeImage = galleryImages.includes(selectedImage ?? "") ? selectedImage : galleryImages[0];
  const isIpad = /^ipad-/i.test(productSlug);
  const isPencil = /^apple-pencil-/i.test(productSlug);
  const productImageClass = isPencil
    ? "rotate-[34deg] scale-[1.0]"
    : isIpad
      ? "absolute inset-0 p-4 sm:p-6"
      : "";

  const specGroups = groupProductSpecs(specs);
  const hasSpecs = specGroups.length > 0;
  // На карточке товара (рядом с фото) показываем только самое важное —
  // первые 3 пункта из highlights (они в prisma/seed.ts уже отсортированы
  // по значимости). Полный список особенностей и так дублируется в
  // характеристиках/сравнении ниже, незачем повторять всё дважды.
  const topHighlights = (highlights ?? []).slice(0, 3);
  const hasHighlights = topHighlights.length > 0;
  const hasComparison = Boolean(previousGenLabel && previousGenHighlights && previousGenHighlights.length > 0);

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:gap-10 md:grid-cols-2">
        <div>
          {/* Минималистично: одно крупное фото + ряд миниатюр под ним, без
              лишних рамок и подписей — как просили, "чисто, но понятно". */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-white text-zinc-300 sm:rounded-3xl">
            {activeImage ? (
              <img
                src={activeImage}
                alt={`${productName}${activeColor ? `, ${activeColor}` : ""}`}
                className={`h-full w-full rounded-2xl object-contain sm:rounded-3xl ${productImageClass}`}
              />
            ) : (
              <span className="text-sm">Фото скоро появится</span>
            )}
            <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
              <CompareButton slug={productSlug} />
              {selectedId && <FavoriteButton variantId={selectedId} />}
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {galleryImages.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border transition-colors sm:h-16 sm:w-16 ${
                    url === activeImage
                      ? "border-accent"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <img src={url} alt="" className={`h-full w-full ${isIpad ? "object-contain p-1" : "object-cover"}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {brand && (
            <div className="text-sm font-medium uppercase tracking-wide text-accent">
              {brand}
            </div>
          )}
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            {productName}
          </h1>

          {description && (
            <p className="mt-4 text-sm leading-6 text-zinc-600">{description}</p>
          )}

          {hasHighlights && (
            <ul className="mt-5 space-y-2">
              {topHighlights.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-zinc-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <ProductOrder
              productName={productName}
              variants={variants}
              initialVariantId={initialVariantId}
              onSelectedVariantChange={setSelectedId}
            />
          </div>
        </div>
      </div>

      {/* Сравнение с предыдущим поколением и характеристики — под основным
          блоком, во всю ширину. Сравнение — сначала (выше), характеристики —
          после (ниже): по просьбе пользователя, чтобы сначала было видно
          "чем лучше", а подробная таблица шла за ним. На мобильных это же
          определяет порядок сверху вниз, т.к. на маленьком экране колонки
          складываются в одну. Оба блока не рендерятся, если данных нет —
          старые товары выглядят как раньше. */}
      {(hasSpecs || hasComparison) && (
        // Специально в одну колонку (не side-by-side), чтобы характеристики
        // гарантированно шли НИЖЕ сравнения на любом экране, а не просто
        // слева/справа на десктопе.
        <div className="mt-16 flex w-full flex-col gap-10">
          {hasComparison && (
            <div className="rounded-3xl bg-zinc-50 p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Чем лучше {previousGenLabel}
              </h2>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {previousGenHighlights!.map((item) => (
                  <li key={item} className="flex gap-2 rounded-2xl bg-white p-4 text-sm leading-6 text-zinc-700 shadow-sm">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasSpecs && (
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">
                Характеристики
              </h2>
              <div className="mt-6 space-y-8">
                {specGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="mb-3 text-base font-semibold text-foreground">{group.title}</h3>
                    <dl className="grid gap-3 md:grid-cols-2">
                      {group.entries.map(([label, value]) => (
                        <div key={label} className="flex flex-col gap-1 rounded-2xl border border-zinc-100 px-4 py-4 text-sm">
                          <dt className="shrink-0 text-xs uppercase tracking-wide text-zinc-400">{label}</dt>
                          <dd className="text-left font-medium leading-6 text-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
