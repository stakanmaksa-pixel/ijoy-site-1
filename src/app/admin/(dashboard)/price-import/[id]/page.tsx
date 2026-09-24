import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { canonicalIphoneModel, normalizedIphoneSim, normalizeForMatch, parsePriceLine } from "@/lib/priceImport";
import { acceptLine, acceptAllMatched, applyAsFullPriceList, createVariantFromLine, rejectLine } from "../actions";
import { ProductPicker, VariantPicker, type ImportVariantOption } from "./ImportPickers";

export const dynamic = "force-dynamic";

const LINE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Нет совпадения",
  MATCHED: "Найдено совпадение",
  NEW_VARIANT: "Новая модификация",
  ACCEPTED: "Принято",
  REJECTED: "Пропущено / отклонено",
  ERROR: "Ошибка разбора",
};

const LINE_STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  MATCHED: "bg-blue-100 text-blue-800",
  NEW_VARIANT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-zinc-200 text-zinc-600",
  ERROR: "bg-red-100 text-red-700",
};

export default async function PriceImportBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const batch = await prisma.priceImportBatch.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { id: "asc" } },
    },
  });

  if (!batch) {
    notFound();
  }

  const variantIds = batch.lines
    .map((l) => l.matchedVariantId)
    .filter((v): v is string => Boolean(v));

  const [matchedVariants, allProducts] = await Promise.all([
    prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      include: { product: true },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { variants: { orderBy: { price: "asc" } } },
    }),
  ]);

  const variantById = new Map(matchedVariants.map((v) => [v.id, v]));
  const matchedCount = batch.lines.filter((l) => l.status === "MATCHED").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
        <h1 className="text-xl font-semibold text-zinc-900">
            Партия от{" "}
            {new Intl.DateTimeFormat("ru-RU", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(batch.createdAt)}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {batch.lines.length} позиций · {matchedCount} совпадений найдено автоматически
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {matchedCount > 0 && (
            <form action={acceptAllMatched}>
              <input type="hidden" name="batchId" value={batch.id} />
              <button type="submit" className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700">
                Принять все совпавшие ({matchedCount})
              </button>
            </form>
          )}
          <form action={applyAsFullPriceList}>
            <input type="hidden" name="batchId" value={batch.id} />
            <button
              type="submit"
              className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white"
              title="Используйте только для полного прайса поставщика"
            >
              Применить как полный прайс
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-xs leading-5 text-zinc-500">
        Сначала проверь автоматические совпадения и нажми «Принять все совпавшие». Для iPhone учитываются модель, память, цвет и тип SIM; страна используется для определения SIM, но не мешает совпадению.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {batch.lines.map((line) => {
          const matchedVariant = line.matchedVariantId ? variantById.get(line.matchedVariantId) : null;
          const isDecided = line.status === "ACCEPTED" || line.status === "REJECTED";
          const lineModel = canonicalIphoneModel(line.parsedModel ?? "");
          const lineMemory = line.parsedMemory ? normalizeForMatch(line.parsedMemory) : null;
          const lineColor = line.parsedColor ? normalizeForMatch(line.parsedColor) : null;
          const lineSim = normalizedIphoneSim(line.parsedRegion, lineModel);
          const rawParsedLine = parsePriceLine(line.rawLine);
          const sourceLabel = normalizeForMatch(line.parsedModel ?? "");
          const suggestedPhoneVariants = allProducts
            .filter((product) => lineModel && canonicalIphoneModel(product.name) === lineModel)
            .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
            .filter(({ variant }) => {
              if (lineMemory && normalizeForMatch(variant.memory ?? "") !== lineMemory) return false;
              if (lineColor && normalizeForMatch(variant.color ?? "") !== lineColor) return false;
              if (lineSim) {
                const stored = normalizedIphoneSim(parsePriceLine(variant.rawLabel ?? "").parsedRegion ?? variant.region, lineModel);
                if (stored !== lineSim) return false;
              }
              return true;
            });
          const suggestedExactVariants = allProducts
            .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
            .filter(({ variant }) => {
              if (rawParsedLine.parsedSku && variant.sku && normalizeForMatch(rawParsedLine.parsedSku) === normalizeForMatch(variant.sku)) return true;
              if (lineModel || !variant.rawLabel || !sourceLabel) return false;
              const storedLabel = parsePriceLine(variant.rawLabel).parsedModel ?? variant.rawLabel;
              return normalizeForMatch(storedLabel) === sourceLabel;
            });
          const suggestedVariants = [...new Map(
            [...suggestedPhoneVariants, ...suggestedExactVariants].map(({ product, variant }) => [variant.id, { product, variant }]),
          ).values()];
          const pickerOptions: ImportVariantOption[] = suggestedVariants.map(({ product, variant }) => ({
            id: variant.id,
            productName: product.name,
            productSlug: product.slug,
            memory: variant.memory,
            color: variant.color,
            region: variant.region ?? parsePriceLine(variant.rawLabel ?? "").parsedRegion,
            price: variant.price == null ? null : Number(variant.price),
          }));
          const pickerQuery = [lineModel?.replace(/^iPhone\s+/i, ""), line.parsedMemory, line.parsedColor, lineSim]
            .filter(Boolean).join(" ") || line.parsedModel || "";

          return (
            <div key={line.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-zinc-900">{line.rawLine}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {line.parsedPrice !== null ? (
                      <>распознанная цена: {formatPrice(Number(line.parsedPrice))}</>
                    ) : (
                      <span className="text-red-600">цена не распознана</span>
                    )}
                    {line.parsedMemory && <> · {line.parsedMemory}</>}
                    {line.parsedColor && <> · {line.parsedColor}</>}
                    {line.parsedRegion && <> · {line.parsedRegion}</>}
                    {line.note && <> · {line.note}</>}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs ${LINE_STATUS_CLASS[line.status] ?? "bg-zinc-100 text-zinc-700"}`}
                >
                  {LINE_STATUS_LABEL[line.status] ?? line.status}
                </span>
              </div>

              {!isDecided && line.parsedPrice !== null && (
                <form action={acceptLine} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="batchId" value={batch.id} />

                  {pickerOptions.length > 0 ? (
                    <VariantPicker
                      options={pickerOptions}
                      suggestedIds={pickerOptions.map((option) => option.id)}
                      selectedId={line.matchedVariantId}
                      initialQuery={pickerQuery}
                      submitLabel="Применить цену"
                    />
                  ) : (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      Точной модификации автоматически не найдено. Найди товар ниже; цена не будет назначена похожему цвету или памяти.
                    </p>
                  )}

                  {matchedVariant && (
                    <span className="text-xs text-zinc-500">
                      совпало с «{matchedVariant.product.name}
                      {matchedVariant.memory ? `, ${matchedVariant.memory}` : ""}» (сейчас{" "}
                      {matchedVariant.price != null
                        ? formatPrice(Number(matchedVariant.price))
                        : "цена не указана"}
                      )
                    </span>
                  )}

                </form>
              )}

              {!isDecided && !matchedVariant && line.parsedPrice !== null && (
                <form
                  action={createVariantFromLine}
                  className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-zinc-300 p-3"
                >
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="batchId" value={batch.id} />

                  <ProductPicker
                    products={allProducts.map(({ id, name, slug }) => ({ id, name, slug }))}
                    initialQuery={lineModel?.replace(/^iPhone\s+/i, "") ?? line.parsedModel ?? ""}
                    submitLabel="Создать и принять"
                  />

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    {/\bapple\s+watch\b/i.test(line.rawLine) ? "Размер корпуса" : "Память"}
                    <input
                      name="memory"
                      defaultValue={line.parsedMemory ?? ""}
                      className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    Цвет
                    <input
                      name="color"
                      defaultValue={line.parsedColor ?? ""}
                      placeholder="из строки выше"
                      className="w-28 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    {line.parsedRegion && /^(?:XS\/S|S\/M|M\/L|S|M|L)$/i.test(line.parsedRegion) ? "Размер ремешка" : "Регион"}
                    <input
                      name="region"
                      defaultValue={line.parsedRegion ?? ""}
                      className="w-48 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                </form>
              )}

              {!isDecided && (
                <form action={rejectLine} className="mt-2">
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="batchId" value={batch.id} />
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700">
                    Пропустить эту строку
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
