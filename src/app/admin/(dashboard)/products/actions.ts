"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@/generated/prisma/client";

// Загрузка фото товаров — файлы лежат в public/uploads/products/<slug>/,
// а в docker-compose.yml на эту папку примонтирован отдельный volume, чтобы
// фото не терялись при пересборке образа (см. Dockerfile/docker-compose.yml).
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "products");
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 МБ — с запасом для нормального фото с телефона
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function parseImages(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function isProductStatus(value: string): value is ProductStatus {
  return value === "DRAFT" || value === "PUBLISHED" || value === "HIDDEN";
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/catalog");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");
  const images = parseImages(String(formData.get("images") ?? ""));

  if (!name || !categoryId) return;

  const product = await prisma.product.create({
    data: {
      name,
      slug: slugInput || slugify(name),
      categoryId,
      brand: brand || null,
      description: description || null,
      status: isProductStatus(statusRaw) ? statusRaw : "DRAFT",
      images,
    },
  });

  revalidatePath("/admin/products");
  revalidateStorefront();
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "DRAFT");
  const images = parseImages(String(formData.get("images") ?? ""));

  if (!id || !name || !slug || !categoryId) return;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      slug,
      categoryId,
      brand: brand || null,
      description: description || null,
      status: isProductStatus(statusRaw) ? statusRaw : "DRAFT",
      images,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath(`/product/${slug}`);
  revalidateStorefront();
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.product.delete({ where: { id } });

  revalidatePath("/admin/products");
  revalidateStorefront();
  redirect("/admin/products");
}

export async function createVariant(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const memory = String(formData.get("memory") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const inStock = formData.get("inStock") === "on";

  if (!productId || !Number.isFinite(price) || price <= 0) return;

  await prisma.productVariant.create({
    data: {
      productId,
      memory: memory || null,
      color: color || null,
      region: region || null,
      sku: sku || null,
      price,
      inStock,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefront();
}

export async function updateVariant(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const memory = String(formData.get("memory") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const inStock = formData.get("inStock") === "on";

  if (!id || !Number.isFinite(price) || price <= 0) return;

  await prisma.productVariant.update({
    where: { id },
    data: {
      memory: memory || null,
      color: color || null,
      region: region || null,
      sku: sku || null,
      price,
      inStock,
    },
  });

  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefront();
}

export async function deleteVariant(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const productId = String(formData.get("productId") ?? "");
  if (!id) return;

  await prisma.productVariant.delete({ where: { id } });

  revalidatePath(`/admin/products/${productId}`);
  revalidateStorefront();
}

// ---------- Фото товара ----------

// Загрузка одного фото. Если передан color — фото уходит в colorImages под
// этот цвет (так на странице товара при выборе цвета показываются именно
// его фото); без цвета — в общий список images (для товаров без деления по
// цвету, например аксессуаров без вариаций).
export async function uploadProductImage(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const file = formData.get("file");

  if (!productId || !slug || !(file instanceof File) || file.size === 0) return;
  if (file.size > MAX_UPLOAD_BYTES) return;
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) return;

  const dir = path.join(UPLOAD_ROOT, slug);
  await mkdir(dir, { recursive: true });

  const filename = `${color ? `${slugify(color)}-` : ""}${Date.now()}-${crypto
    .randomBytes(3)
    .toString("hex")}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  const publicPath = `/uploads/products/${slug}/${filename}`;

  if (color) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { colorImages: true },
    });
    const current = (product?.colorImages as Record<string, string[]> | null) ?? {};
    const list = current[color] ?? [];
    await prisma.product.update({
      where: { id: productId },
      data: { colorImages: { ...current, [color]: [...list, publicPath] } },
    });
  } else {
    await prisma.product.update({
      where: { id: productId },
      data: { images: { push: publicPath } },
    });
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product/${slug}`);
  revalidateStorefront();
}

// Удаление одного фото — и из БД, и (по возможности) самого файла с диска.
export async function deleteProductImage(formData: FormData) {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const slug = String(formData.get("slug") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const url = String(formData.get("url") ?? "");
  if (!productId || !url) return;

  if (color) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { colorImages: true },
    });
    const current = (product?.colorImages as Record<string, string[]> | null) ?? {};
    const nextForColor = (current[color] ?? []).filter((u) => u !== url);
    const next = { ...current, [color]: nextForColor };
    await prisma.product.update({ where: { id: productId }, data: { colorImages: next } });
  } else {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { images: true },
    });
    const next = (product?.images ?? []).filter((u) => u !== url);
    await prisma.product.update({ where: { id: productId }, data: { images: next } });
  }

  // Файл может уже отсутствовать (например, если папку чистили руками) —
  // это не повод падать, запись в БД уже удалена.
  try {
    await unlink(path.join(process.cwd(), "public", url.replace(/^\//, "")));
  } catch {
    // игнорируем — главное, что ссылки на файл в БД больше нет
  }

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath(`/product/${slug}`);
  revalidateStorefront();
}
