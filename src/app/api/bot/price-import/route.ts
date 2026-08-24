import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePriceListText, parsePriceLine, normalizeForMatch } from "@/lib/priceImport";
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
    where: { rawLabel: { not: null } },
    select: { id: true, rawLabel: true },
  });
  const byNormalized = new Map<string, string>();
  for (const v of existingVariants) {
    if (!v.rawLabel) continue;
    // rawLabel в старых записях (например из seed) может ещё содержать
    // цену в конце строки — отбрасываем её так же, как для входящих строк,
    // чтобы сопоставление работало независимо от формата хранения.
    const { parsedModel } = parsePriceLine(v.rawLabel);
    const key = normalizeForMatch(parsedModel ?? v.rawLabel);
    byNormalized.set(key, v.id);
  }

  const batch = await prisma.priceImportBatch.create({
    data: {
      source: "telegram-bot",
      rawText: text,
      lines: {
        create: parsedLines.map((line) => {
          const key = line.parsedModel ? normalizeForMatch(line.parsedModel) : null;
          const matchedVariantId = key ? byNormalized.get(key) ?? null : null;

          let status: ImportLineStatus = "PENDING";
          let note: string | null = null;

          if (line.parsedPrice === null) {
            status = "ERROR";
            note = "Не удалось распознать цену в конце строки";
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
        }),
      },
    },
    include: { lines: true },
  });

  const total = batch.lines.length;
  const matched = batch.lines.filter((l) => l.status === "MATCHED").length;
  const errors = batch.lines.filter((l) => l.status === "ERROR").length;
  const unmatched = total - matched - errors;

  return NextResponse.json({
    batchId: batch.id,
    total,
    matched,
    unmatched,
    errors,
  });
}
