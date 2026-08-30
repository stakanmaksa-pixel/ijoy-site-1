import { PageHero } from "@/components/PageHero";
import { getIphoneCompareLineup } from "@/lib/catalog";
import { CompareTable } from "@/components/CompareTable";

export const metadata = {
  title: "Сравнить iPhone — iJoy Gadget Store",
  description: "Сравнение моделей iPhone по характеристикам, как на сайте Apple.",
};

// Страница сравнения — по образцу apple.com/iphone/compare/: колонки по
// моделям (фото, цвет, цена) сверху и таблица характеристик снизу. Модели
// берутся из реального прайса (getIphoneCompareLineup), поэтому список сам
// сузится/расширится вместе с ассортиментом — ничего вручную поддерживать
// не нужно. Пока подробные характеристики (specs) заполнены только у части
// линейки — у остальных моделей их строки в таблице просто будут "–".
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const models = await getIphoneCompareLineup();
  const params = await searchParams;
  const raw = Array.isArray(params.models) ? params.models[0] : params.models;
  const requested = raw?.split(",").filter(Boolean) ?? [];
  // Берём из URL только реально существующие модели и не даём открыть больше
  // трёх колонок. Так ссылка из нижней панели всегда безопасна, даже если
  // ассортимент уже успел измениться.
  const initialSlugs = requested.filter((slug) => models.some((model) => model.slug === slug)).slice(0, 3);

  return (
    <div>
      <PageHero title="Сравнить iPhone iJoy Gadget Store" highlight="Сравнить" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {models.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Сейчас нет моделей iPhone в наличии для сравнения.
          </p>
        ) : (
          <CompareTable models={models} initialSlugs={initialSlugs} />
        )}
      </div>
    </div>
  );
}
