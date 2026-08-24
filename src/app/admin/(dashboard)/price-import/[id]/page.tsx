import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { acceptLine, acceptAllMatched, createVariantFromLine, rejectLine } from "../actions";

export const dynamic = "force-dynamic";

const LINE_STATUS_LABEL: Record<string, string> = {
  PENDING: "Нет совпадения",
  MATCHED: "Найдено совпадение",
  NEW_VARIANT: "Новая модификация",
  ACCEPTED: "Принято",
  REJECTED: "Отклонено",
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
          <p className="mt-1 text-sm text-zinc-500">{batch.lines.length} позиций в прайсе</p>
        </div>

        {matchedCount > 0 && (
          <form action={acceptAllMatched}>
            <input type="hidden" name="batchId" value={batch.id} />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Принять все совпавшие ({matchedCount})
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {batch.lines.map((line) => {
          const matchedVariant = line.matchedVariantId ? variantById.get(line.matchedVariantId) : null;
          const isDecided = line.status === "ACCEPTED" || line.status === "REJECTED";

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

                  <select
                    name="variantId"
                    defaultValue={line.matchedVariantId ?? ""}
                    required
                    className="min-w-[260px] rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  >
                    <option value="" disabled>
                      Выберите модификацию…
                    </option>
                    {allProducts.map((product) => (
                      <optgroup key={product.id} label={product.name}>
                        {product.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {[v.memory, v.color, v.region].filter(Boolean).join(" · ") || "без атрибутов"} —{" "}
                            {v.price != null ? formatPrice(Number(v.price)) : "цена не указана"}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

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

                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-500"
                  >
                    Применить цену
                  </button>
                </form>
              )}

              {!isDecided && !matchedVariant && line.parsedPrice !== null && (
                <form
                  action={createVariantFromLine}
                  className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-zinc-300 p-3"
                >
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="batchId" value={batch.id} />

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    Или создать модификацию у товара
                    <select
                      name="productId"
                      required
                      defaultValue=""
                      className="min-w-[180px] rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      <option value="" disabled>
                        Выберите товар…
                      </option>
                      {allProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    Память
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
                      placeholder="из строки выше"
                      className="w-28 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-zinc-600">
                    Регион
                    <input
                      name="region"
                      defaultValue={line.parsedRegion ?? ""}
                      className="w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    />
                  </label>

                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white hover:bg-zinc-700"
                  >
                    Создать и принять
                  </button>
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
