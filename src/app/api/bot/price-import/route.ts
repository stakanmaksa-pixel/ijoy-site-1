import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canonicalIphoneModel,
  inactivePreferenceKey,
  normalizedIphoneRegion,
  normalizedIphoneSim,
  normalizeForMatch,
  parsePriceLine,
  parsePriceListText,
} from "@/lib/priceImport";
import type { ImportLineStatus } from "@/generated/prisma/client";

// Эндпоинт для Telegram-бота (кнопка «Обновить цены на сайте» в bot_v2.py).
// Бот присылает сюда сырой текст прайса — мы его парсим и складываем в
// PriceImportBatch/PriceImportLine как есть, ничего не применяя к товарам
// автоматически. Реальное применение цен — только вручную в /admin/price-import,
// чтобы ошибка сопоставления не могла сама сломать цены на сайте.

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.BOT_API_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).text === "string"
      ? ((body as Record<string, unknown>).text as string)
      : "";

  if (!text.trim()) {
    return NextResponse.json({ error: "empty text" }, { status: 400 });
  }

  const parsedLines = parsePriceListText(text);
  if (parsedLines.length === 0) {
    return NextResponse.json({ error: "no lines" }, { status: 400 });
  }

  const existingVariants = await prisma.productVariant.findMany({
    select: { id: true, sku: true, rawLabel: true, memory: true, color: true, region: true, product: { select: { name: true } } },
  });
  const byNormalized = new Map<string, string>();
  const bySku = new Map<string, string>();
  const byConfiguration = new Map<string, string[]>();
  const bySimConfiguration = new Map<string, string[]>();
  for (const v of existingVariants) {
    if (v.sku) bySku.set(normalizeForMatch(v.sku), v.id);
    if (v.rawLabel) {
      // Старые подписи могли содержать цену в конце строки.
      const { parsedModel } = parsePriceLine(v.rawLabel);
      const key = normalizeForMatch(parsedModel ?? v.rawLabel);
      byNormalized.set(key, v.id);
    }

    const model = canonicalIphoneModel(v.product.name);
    const memory = v.memory ? normalizeForMatch(v.memory) : "";
    const color = v.color ? normalizeForMatch(v.color) : "";
    const oldLabelRegion = v.rawLabel ? parsePriceLine(v.rawLabel).parsedRegion : null;
    const region = normalizedIphoneRegion(oldLabelRegion ?? v.region, model);
    if (!model || !memory || !color || !region) continue;
    const descriptor = [model, memory, color, normalizeForMatch(region)].join("|");
    byConfiguration.set(descriptor, [...(byConfiguration.get(descriptor) ?? []), v.id]);
    const sim = normalizedIphoneSim(oldLabelRegion ?? v.region, model);
    if (sim) {
      const simDescriptor = [model, memory, color, normalizeForMatch(sim)].join("|");
      bySimConfiguration.set(simDescriptor, [...(bySimConfiguration.get(simDescriptor) ?? []), v.id]);
    }
  }

  // If a supplier sends both active and inactive prices for the same exact
  // configuration, the storefront uses the inactive price as requested.
  const inactiveKeys = new Set(parsedLines
    .filter((line) => line.nonActive)
    .map(inactivePreferenceKey)
    .filter((key): key is string => Boolean(key)));

  const variantByIdExisting = new Map(existingVariants.map((variant) => [variant.id, variant]));
  const filterByCondition = (candidateIds: string[], nonActive: boolean) => {
    const hasDedicatedInactiveVariant = candidateIds.some((id) => {
      const variant = variantByIdExisting.get(id);
      return /(?:^|[^\p{L}])неактив(?=$|[^\p{L}])/iu.test(`${variant?.rawLabel ?? ""} ${variant?.region ?? ""}`);
    });
    if (nonActive && !hasDedicatedInactiveVariant) return candidateIds;
    return candidateIds.filter((id) => {
      const variant = variantByIdExisting.get(id);
      const storedNonActive = /(?:^|[^\p{L}])неактив(?=$|[^\p{L}])/iu.test(`${variant?.rawLabel ?? ""} ${variant?.region ?? ""}`);
      return storedNonActive === nonActive;
    });
  };

  const preparedLines = parsedLines.map((line) => {
    const key = line.parsedModel ? normalizeForMatch(line.parsedModel) : null;
    let matchedVariantId = line.parsedSku
      ? bySku.get(normalizeForMatch(line.parsedSku)) ?? null
      : null;
    if (!matchedVariantId && key) matchedVariantId = byNormalized.get(key) ?? null;
    if (!matchedVariantId && line.phoneModel && line.parsedMemory && line.parsedColor && line.parsedRegion) {
      const descriptor = [
        line.phoneModel,
        normalizeForMatch(line.parsedMemory),
        normalizeForMatch(line.parsedColor),
        normalizeForMatch(line.parsedRegion),
      ].join("|");
      const candidates = byConfiguration.get(descriptor) ?? [];
      const compatible = filterByCondition(candidates, line.nonActive);
      if (compatible.length === 1) matchedVariantId = compatible[0];

      // The site may store "eSIM" while a supplier row says "JP · eSIM".
      if (!matchedVariantId) {
        const sim = normalizedIphoneSim(line.parsedRegion, line.phoneModel);
        if (sim) {
          const simDescriptor = [
            line.phoneModel,
            normalizeForMatch(line.parsedMemory),
            normalizeForMatch(line.parsedColor),
            normalizeForMatch(sim),
          ].join("|");
          const simCandidates = filterByCondition(bySimConfiguration.get(simDescriptor) ?? [], line.nonActive);
          if (simCandidates.length === 1) matchedVariantId = simCandidates[0];
        }
      }
    }

    const rowKey = inactivePreferenceKey(line);
    const inactiveOverrides = Boolean(rowKey && inactiveKeys.has(rowKey) && !line.nonActive);
    let status: ImportLineStatus = "PENDING";
    let note: string | null = null;

    if (line.parsedPrice === null) {
      status = "ERROR";
      note = "Не удалось распознать цену в конце строки";
    } else if (line.phoneModel && line.parsedMemory && !line.parsedColor) {
      status = "ERROR";
      note = "Не удалось определить цвет — не сопоставляем цену с похожей модификацией; уточняйте у менеджера";
    } else if (inactiveOverrides) {
      status = "REJECTED";
      note = "Пропущено: для этой модификации в прайсе есть цена «НЕАКТИВ»";
    } else if (matchedVariantId) {
      status = "MATCHED";
    }

    return {
      rawLine: line.rawLine,
      parsedModel: line.parsedModel,
      parsedMemory: line.parsedMemory,
      parsedColor: line.parsedColor,
      parsedRegion: line.parsedRegion,
      parsedPrice: line.parsedPrice,
      matchedVariantId,
      status,
      note,
    };
  });

  // Different source countries can collapse to one storefront SIM variant.
  // Select the lowest remaining offer so bulk approval cannot overwrite it
  // later with a higher country-specific price.
  const indexesByVariant = new Map<string, number[]>();
  preparedLines.forEach((line, index) => {
    if (line.status !== "MATCHED" || !line.matchedVariantId) return;
    indexesByVariant.set(line.matchedVariantId, [...(indexesByVariant.get(line.matchedVariantId) ?? []), index]);
  });
  for (const indexes of indexesByVariant.values()) {
    if (indexes.length < 2) continue;
    const winnerIndex = indexes.reduce((best, index) => {
      const currentPrice = preparedLines[index].parsedPrice ?? Number.POSITIVE_INFINITY;
      const bestPrice = preparedLines[best].parsedPrice ?? Number.POSITIVE_INFINITY;
      if (currentPrice < bestPrice) return index;
      if (currentPrice === bestPrice && parsedLines[index].nonActive && !parsedLines[best].nonActive) return index;
      return best;
    }, indexes[0]);
    const bestPrice = preparedLines[winnerIndex].parsedPrice;
    preparedLines[winnerIndex].note = `Минимальная цена из ${indexes.length} предложений для этой модификации и SIM`;
    for (const index of indexes) {
      if (index === winnerIndex) continue;
      preparedLines[index].status = "REJECTED";
      preparedLines[index].note = `Пропущено: для этой модификации выбрана более низкая цена ${bestPrice?.toLocaleString("ru-RU")} ₽`;
    }
  }

  const batch = await prisma.priceImportBatch.create({
    data: {
      source: "telegram-bot",
      rawText: text,
      lines: {
        create: preparedLines,
      },
    },
    include: { lines: true },
  });

  const total = batch.lines.length;
  const matched = batch.lines.filter((l) => l.status === "MATCHED").length;
  const errors = batch.lines.filter((l) => l.status === "ERROR").length;
  const skipped = batch.lines.filter((l) => l.status === "REJECTED").length;
  const unmatched = total - matched - errors - skipped;

  return NextResponse.json({
    batchId: batch.id,
    total,
    matched,
    unmatched,
    errors,
    skipped,
  });
}
