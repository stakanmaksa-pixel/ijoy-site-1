"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { ProductStatus } from "@/generated/prisma/client";

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
