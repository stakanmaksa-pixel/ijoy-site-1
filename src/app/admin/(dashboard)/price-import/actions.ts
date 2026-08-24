"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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
  if (!line || !variantId || line.parsedPrice === null) return;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      price: line.parsedPrice,
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
    if (!line.matchedVariantId || line.parsedPrice === null) continue;
    await prisma.productVariant.update({
      where: { id: line.matchedVariantId },
      data: {
        price: line.parsedPrice,
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
  if (!line || !productId || line.parsedPrice === null) return;

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      memory: memory || null,
      color: color || null,
      region: region || null,
      price: line.parsedPrice,
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
