import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { canonicalIphoneModel, describeMacBookConfiguration, isPriceOnRequest, normalizedIphoneSim, normalizedMemory, normalizeForMatch, parsePriceLine, supplierIdentityKey } from "@/lib/priceImport";
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
  const unresolvedCount = batch.lines.filter((line) =>
    line.status !== "ACCEPTED" && line.status !== "REJECTED" &&
    !(line.status === "MATCHED" && line.matchedVariantId && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine))),
  ).length;
  const hasApplicableRows = batch.lines.some((line) =>
    (line.status === "ACCEPTED" || line.status === "MATCHED") &&
    line.matchedVariantId && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine)),
  );
  const canApplyFullPrice = unresolvedCount === 0 && hasApplicableRows;

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
              disabled={!canApplyFullPrice}
              className="rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Цены снимутся только у ранее подтверждённых позиций этого источника, которых нет в текущем прайсе"
            >
              {unresolvedCount > 0
                ? `Сначала разберите строки (${unresolvedCount})`
                : hasApplicableRows
                  ? "Применить полный прайс"
                  : "Нет совпавших позиций для применения"}
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-xs leading-5 text-zinc-500">
        Для применения полного прайса сначала разреши все строки без совпадения. Отсутствующим в сегодняшнем прайсе позициям этого источника цена снимется («Уточняйте у менеджера»); другие товары каталога не затрагиваются. Если на один вариант найдено несколько цен, применяется минимальная. Для iPhone учитываются модель, память, цвет и тип SIM.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {batch.lines.map((line) => {
          const matchedVariant = line.matchedVariantId ? variantById.get(line.matchedVariantId) : null;
          const sourceMacBook = describeMacBookConfiguration(line.parsedModel, line.parsedMemory, line.parsedColor);
          const catalogMacBook = matchedVariant && sourceMacBook
            ? describeMacBookConfiguration(
              [matchedVariant.product.name, matchedVariant.rawLabel].filter(Boolean).join(" · "),
              matchedVariant.memory,
              matchedVariant.color,
            )
            : null;
          const isDecided = line.status === "ACCEPTED" || line.status === "REJECTED";
          const lineModel = canonicalIphoneModel(line.parsedModel ?? "");
          const lineMemory = normalizedMemory(line.parsedMemory);
          const lineColor = line.parsedColor ? normalizeForMatch(line.parsedColor) : null;
          const lineSim = normalizedIphoneSim(line.parsedRegion, lineModel);
          const rawParsedLine = parsePriceLine(line.rawLine);
          const sourceLabel = supplierIdentityKey(line.parsedModel);
          const productVariants = allProducts
            .filter((product) => lineModel && canonicalIphoneModel(product.name) === lineModel)
            .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
            ;
          const memoryColorVariants = productVariants.filter(({ variant }) => {
              const stored = parsePriceLine(variant.rawLabel ?? "");
              const storedMemories = [normalizedMemory(variant.memory), normalizedMemory(stored.parsedMemory)];
              const storedColors = [variant.color, stored.parsedColor]
                .filter((value): value is string => Boolean(value))
                .map(normalizeForMatch);
              if (lineMemory && !storedMemories.includes(lineMemory)) return false;
              if (lineColor && !storedColors.includes(lineColor)) return false;
              return true;
            });
          const suggestedPhoneVariants = memoryColorVariants
            .filter(({ variant }) => {
              if (lineSim) {
                const storedLabelRegion = parsePriceLine(variant.rawLabel ?? "").parsedRegion;
                const storedSims = [
                  normalizedIphoneSim(storedLabelRegion, lineModel),
                  normalizedIphoneSim(variant.region, lineModel),
                ];
                if (!storedSims.includes(lineSim)) return false;
              }
              return true;
            });
          const suggestedExactVariants = allProducts
            .flatMap((product) => product.variants.map((variant) => ({ product, variant })))
            .filter(({ variant }) => {
              if (rawParsedLine.parsedSku && variant.sku && normalizeForMatch(rawParsedLine.parsedSku) === normalizeForMatch(variant.sku)) return true;
              if (lineModel || !variant.rawLabel || !sourceLabel) return false;
              const storedLabel = parsePriceLine(variant.rawLabel).parsedModel ?? variant.rawLabel;
              return supplierIdentityKey(storedLabel) === sourceLabel;
            });
          const suggestedVariants = [...new Map(
            [...suggestedPhoneVariants, ...suggestedExactVariants].map(({ product, variant }) => [variant.id, { product, variant }]),
          ).values()];
          // If legacy variants have empty/inconsistent memory or colour columns,
          // still make the existing model's options selectable for deliberate
          // manual mapping instead of sending the admin straight to "create".
          const fallbackVariants = suggestedVariants.length
            ? suggestedVariants
            : memoryColorVariants.length
              ? memoryColorVariants
              : productVariants;
          const visibleVariants = matchedVariant && !fallbackVariants.some(({ variant }) => variant.id === matchedVariant.id)
            ? [{ product: matchedVariant.product, variant: matchedVariant }, ...fallbackVariants]
            : fallbackVariants;
          const pickerOptions: ImportVariantOption[] = visibleVariants.map(({ product, variant }) => ({
            id: variant.id,
            productName: sourceMacBook
              ? describeMacBookConfiguration(
                [product.name, variant.rawLabel].filter(Boolean).join(" · "),
                variant.memory,
                variant.color,
              )?.label ?? product.name
              : product.name,
            productSlug: product.slug,
            memory: normalizedMemory(variant.memory) ?? normalizedMemory(parsePriceLine(variant.rawLabel ?? "").parsedMemory),
            color: variant.color ?? parsePriceLine(variant.rawLabel ?? "").parsedColor,
            region: lineModel
              ? normalizedIphoneSim(variant.region, lineModel) ?? normalizedIphoneSim(parsePriceLine(variant.rawLabel ?? "").parsedRegion, lineModel)
              : variant.region ?? parsePriceLine(variant.rawLabel ?? "").parsedRegion,
            price: variant.price == null ? null : Number(variant.price),
          }));
          const pickerQuery = [
            lineModel?.replace(/^iPhone\s+/i, ""),
            ...(suggestedVariants.length
              ? [line.parsedMemory, line.parsedColor, lineSim]
              : memoryColorVariants.length
                ? [line.parsedMemory, line.parsedColor]
                : []),
          ].filter(Boolean).join(" ") || line.parsedModel || "";

          return (
            <div key={line.id} className="rounded-2xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-zinc-900">{line.rawLine}</div>
                  {sourceMacBook && (
                    <div className="mt-1 text-sm font-medium text-zinc-800">
                      Из прайса: {sourceMacBook.label}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-zinc-500">
                    {isPriceOnRequest(line.rawLine) ? (
                      <>цена: Уточняйте у менеджера</>
                    ) : line.parsedPrice !== null ? (
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

              {!isDecided && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine)) && (
                <form action={acceptLine} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="batchId" value={batch.id} />

                  {pickerOptions.length > 0 ? (
                    <VariantPicker
                      options={pickerOptions}
                      suggestedIds={suggestedVariants.map(({ variant }) => variant.id)}
                      selectedId={line.matchedVariantId}
                      initialQuery={pickerQuery}
                      submitLabel={isPriceOnRequest(line.rawLine) ? "Подтвердить: уточняйте у менеджера" : "Применить цену"}
                    />
                  ) : !matchedVariant ? (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                      Точного совпадения автоматически не найдено. Выбери существующую модификацию вручную; создавай новую только если такой конфигурации действительно нет на сайте.
                      {lineModel && <> В карточке «{lineModel}» найдено {productVariants.length} вариантов; память и цвет совпали у {memoryColorVariants.length}.</>}
                    </p>
                  ) : null}

                  {matchedVariant && (
                    <div className="basis-full text-xs text-zinc-600">
                      <p>
                        Товар сайта: {catalogMacBook?.label ?? [matchedVariant.product.name, matchedVariant.memory, matchedVariant.color, matchedVariant.region].filter(Boolean).join(" · ")}
                        {matchedVariant.sku && <> · артикул {matchedVariant.sku}</>}
                        {" · сейчас "}{matchedVariant.price != null ? formatPrice(Number(matchedVariant.price)) : "цена не указана"}
                      </p>
                      {sourceMacBook && (!catalogMacBook?.chip || !catalogMacBook.ram) && (
                        <p className="mt-1 text-amber-800">
                          В карточке сайта не указаны чип или ОЗУ. Проверьте эту модификацию перед применением цены.
                        </p>
                      )}
                      {sourceMacBook && catalogMacBook &&
                        ((catalogMacBook.chip && catalogMacBook.chip !== sourceMacBook.chip) ||
                          (catalogMacBook.ram && catalogMacBook.ram !== sourceMacBook.ram)) && (
                          <p className="mt-1 font-semibold text-red-700">
                            Внимание: чип или ОЗУ товара сайта отличаются от прайса. Не применяйте эту цену к выбранной модификации.
                          </p>
                        )}
                    </div>
                  )}

                </form>
              )}

              {!isDecided && !matchedVariant && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine)) && (
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
