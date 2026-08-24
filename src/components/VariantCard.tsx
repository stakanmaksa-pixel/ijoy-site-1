import Link from "next/link";
import { formatPrice } from "@/lib/format";

type Variant = {
  id: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  // null — этой комбинации нет в прайсе, цену нужно уточнять у менеджера.
  price: number | null;
  inStock: boolean;
};

function variantLabel(v: Variant) {
  return [v.memory, v.color, v.region].filter(Boolean).join(" · ") || "Стандарт";
}

// Карточка одной конкретной модификации товара (память + цвет + регион) —
// показывается в сетке, когда у модели несколько модификаций и ни одна ещё
// не выбрана. Клик ведёт на страницу этой же модели с already выбранной
// модификацией (?variant=<id>).
//
// Без сердечка избранного: избранное привязано к товару (slug), а не к
// конкретной модификации, и все карточки в этой сетке принадлежат одному и
// тому же товару — сердечко здесь дублировалось бы одинаково на каждой
// карточке и при клике "загоралось" сразу на всех.
export function VariantCard({ slug, variant }: { slug: string; variant: Variant }) {
  return (
    <Link
      href={`/product/${slug}?variant=${variant.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-colors hover:border-accent"
    >
      <div className="flex aspect-square items-center justify-center bg-zinc-50 text-zinc-300">
        <span className="text-sm">Фото</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="text-sm text-zinc-500">{variantLabel(variant)}</div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-base font-semibold text-foreground">
            {variant.price != null ? formatPrice(variant.price) : "Уточняйте у менеджера"}
          </span>
          {!variant.inStock && (
            <span className="text-xs text-zinc-400">Под заказ</span>
          )}
        </div>
      </div>
    </Link>
  );
}
