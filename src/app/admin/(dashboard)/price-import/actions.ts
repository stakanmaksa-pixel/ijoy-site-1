"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isPriceOnRequest } from "@/lib/priceImport";
import type { ImportBatchStatus } from "@/generated/prisma/client";

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/catalog");
}

async function recomputeBatchStatus(batchId: string) {
  const lines = await prisma.priceImportLine.findMany({
    where: { batchId },
    select: { status: true },
  });

  const decided = lines.filter((l) => l.status === "ACCEPTED" || l.status === "REJECTED");
  const accepted = lines.filter((l) => l.status === "ACCEPTED");

  let status: ImportBatchStatus = "PENDING";
  if (decided.length === lines.length && lines.length > 0) {
    status = "APPLIED";
  } else if (accepted.length > 0) {
    status = "PARTIALLY_APPLIED";
  }

  await prisma.priceImportBatch.update({
    where: { id: batchId },
    data: { status },
  });
}

/** Принять строку: применить цену к выбранной (или уже сматченной) модификации. */
export async function acceptLine(formData: FormData) {
  const admin = await requireAdmin();

  const lineId = String(formData.get("lineId") ?? "");
  const batchId = String(formData.get("batchId") ?? "");
  const variantId = String(formData.get("variantId") ?? "");

  const line = await prisma.priceImportLine.findUnique({ where: { id: lineId } });
  if (!line || !variantId || (line.parsedPrice === null && !isPriceOnRequest(line.rawLine))) return;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      price: isPriceOnRequest(line.rawLine) ? null : line.parsedPrice,
      inStock: !isPriceOnRequest(line.rawLine),
      rawLabel: line.parsedModel ?? line.rawLine,
    },
  });

  await prisma.priceImportLine.update({
    where: { id: lineId },
    data: { status: "ACCEPTED", matchedVariantId: variantId, note: null },
  });

  await prisma.priceImportBatch.update({
    where: { id: batchId },
    data: { reviewedAt: new Date(), reviewedById: admin.id },
  });

  await recomputeBatchStatus(batchId);

  revalidatePath(`/admin/price-import/${batchId}`);
  revalidatePath("/admin/price-import");
  revalidateStorefront();
}

/** Принять сразу все автоматически сматченные строки партии. */
export async function acceptAllMatched(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;

  const lines = await prisma.priceImportLine.findMany({
    where: { batchId, status: "MATCHED" },
  });

  for (const line of lines) {
    if (!line.matchedVariantId || (line.parsedPrice === null && !isPriceOnRequest(line.rawLine))) continue;
    await prisma.productVariant.update({
      where: { id: line.matchedVariantId },
      data: {
        price: isPriceOnRequest(line.rawLine) ? null : line.parsedPrice,
        inStock: !isPriceOnRequest(line.rawLine),
        rawLabel: line.parsedModel ?? line.rawLine,
      },
    });
    await prisma.priceImportLine.update({
      where: { id: line.id },
      data: { status: "ACCEPTED" },
    });
  }

  await prisma.priceImportBatch.update({
    where: { id: batchId },
    data: { reviewedAt: new Date(), reviewedById: admin.id },
  });

  await recomputeBatchStatus(batchId);

  revalidatePath(`/admin/price-import/${batchId}`);
  revalidatePath("/admin/price-import");
  revalidateStorefront();
}

/**
 * Применить файл как полный актуальный прайс. Модели и варианты, которых в
 * новом файле нет, мы не прячем из каталога и не удаляем: обнуляем только
 * цену. Покупатель всё равно видит новинку, а вместо устаревшей цены —
 * "Уточняйте у менеджера". Действие намеренно отдельное: его нельзя
 * применять к короткому или тестовому фрагменту прайса.
 */
export async function applyAsFullPriceList(formData: FormData) {
  const admin = await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "");
  if (!batchId) return;

  const batch = await prisma.priceImportBatch.findUnique({
    where: { id: batchId },
    select: { source: true },
  });
  if (!batch) return;

  const lines = await prisma.priceImportLine.findMany({ where: { batchId } });
  const unresolved = lines.some((line) =>
    line.status !== "ACCEPTED" && line.status !== "REJECTED" &&
    !(line.status === "MATCHED" && line.matchedVariantId && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine))),
  );
  if (unresolved || lines.length === 0) return;

  const matched = lines.filter(
    (line) => line.status === "MATCHED" && line.matchedVariantId && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine)),
  );
  const currentVariantIds = new Set(lines
    .filter((line) =>
      (line.status === "ACCEPTED" || line.status === "MATCHED" || line.status === "REJECTED") &&
      line.matchedVariantId && (line.parsedPrice !== null || isPriceOnRequest(line.rawLine)),
    )
    .map((line) => line.matchedVariantId!));
  if (currentVariantIds.size === 0) return;

  // Only variants previously confirmed from this same feed are considered
  // managed by it. A missing row must never erase prices from unrelated items.
  const previouslyAccepted = await prisma.priceImportLine.findMany({
    where: {
      status: "ACCEPTED",
      matchedVariantId: { not: null },
      batch: { is: { source: batch.source } },
    },
    select: { matchedVariantId: true },
  });
  const managedVariantIds = new Set([
    ...previouslyAccepted.map((line) => line.matchedVariantId).filter((id): id is string => Boolean(id)),
    ...currentVariantIds,
  ]);
  const missingVariantIds = [...managedVariantIds].filter((id) => !currentVariantIds.has(id));

  await prisma.$transaction(async (tx) => {
    for (const line of matched) {
      await tx.productVariant.update({
        where: { id: line.matchedVariantId! },
        data: {
          price: isPriceOnRequest(line.rawLine) ? null : line.parsedPrice!,
          inStock: !isPriceOnRequest(line.rawLine),
          rawLabel: line.parsedModel ?? line.rawLine,
        },
      });
      await tx.priceImportLine.update({
        where: { id: line.id },
        data: { status: "ACCEPTED" },
      });
    }

    if (missingVariantIds.length > 0) {
      await tx.productVariant.updateMany({
        where: { id: { in: missingVariantIds } },
        data: { price: null, inStock: false },
      });
    }

    await tx.priceImportBatch.update({
      where: { id: batchId },
      data: { reviewedAt: new Date(), reviewedById: admin.id },
    });
  });

  await recomputeBatchStatus(batchId);
  revalidatePath(`/admin/price-import/${batchId}`);
  revalidatePath("/admin/price-import");
  revalidateStorefront();
}

/**
 * Строка не совпала ни с одной существующей модификацией (например — совсем
 * новая модель телефона). Вместо того чтобы уходить на отдельную страницу
 * товара и вбивать память/цену вручную ещё раз, создаём модификацию сразу
 * тут же, используя то, что уже распознано из строки прайса.
 */
export async function createVariantFromLine(formData: FormData) {
  const admin = await requireAdmin();

  const lineId = String(formData.get("lineId") ?? "");
  const batchId = String(formData.get("batchId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const memory = String(formData.get("memory") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();

  const line = await prisma.priceImportLine.findUnique({ where: { id: lineId } });
  if (!line || !productId || (line.parsedPrice === null && !isPriceOnRequest(line.rawLine))) return;

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      memory: memory || null,
      color: color || null,
      region: region || null,
      price: isPriceOnRequest(line.rawLine) ? null : line.parsedPrice,
      inStock: !isPriceOnRequest(line.rawLine),
      rawLabel: line.parsedModel ?? line.rawLine,
    },
  });

  await prisma.priceImportLine.update({
    where: { id: lineId },
    data: { status: "ACCEPTED", matchedVariantId: variant.id, note: null },
  });

  await prisma.priceImportBatch.update({
    where: { id: batchId },
    data: { reviewedAt: new Date(), reviewedById: admin.id },
  });

  await recomputeBatchStatus(batchId);

  revalidatePath(`/admin/price-import/${batchId}`);
  revalidatePath("/admin/price-import");
  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefront();
}

export async function rejectLine(formData: FormData) {
  const admin = await requireAdmin();
  const lineId = String(formData.get("lineId") ?? "");
  const batchId = String(formData.get("batchId") ?? "");
  if (!lineId || !batchId) return;

  await prisma.priceImportLine.update({
    where: { id: lineId },
    data: { status: "REJECTED" },
  });

  await prisma.priceImportBatch.update({
    where: { id: batchId },
    data: { reviewedAt: new Date(), reviewedById: admin.id },
  });

  await recomputeBatchStatus(batchId);

  revalidatePath(`/admin/price-import/${batchId}`);
  revalidatePath("/admin/price-import");
}
