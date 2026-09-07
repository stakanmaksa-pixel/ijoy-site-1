// Добавляет Magic Keyboard рядом с Apple Pencil и связывает аксессуары с
// актуальными iPad. Безопасен для повторного запуска: варианты сопоставляются
// по исходной строке, а лишние не удаляются, а уходят в скрытый архив.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-apple-keyboard-catalog.ts

import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { variantImageKey } from "../../src/lib/pickCoverImage";
import {
  APPLE_KEYBOARD_ASSETS,
  APPLE_KEYBOARD_CATALOG,
  type AppleKeyboardProduct,
} from "../data/apple-keyboard-catalog";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const dryRun = process.argv.includes("--dry-run");

type Transaction = Prisma.TransactionClient;
type ExistingVariant = {
  id: string;
  color: string | null;
  rawLabel: string | null;
};

const IPAD_KEYBOARD_COMPATIBILITY = [
  {
    slug: "ipad-pro-11-m5",
    keyboard: "Magic Keyboard для iPad Pro 11″ M5",
    text: "Magic Keyboard для iPad Pro 11″ (M5/M4). Для этой диагонали подходит только 11‑дюймовая версия.",
  },
  {
    slug: "ipad-pro-13-m5",
    keyboard: "Magic Keyboard для iPad Pro 13″ M5",
    text: "Magic Keyboard для iPad Pro 13″ (M5/M4). Для этой диагонали подходит только 13‑дюймовая версия.",
  },
  {
    slug: "ipad-air-11-m4",
    keyboard: "Magic Keyboard для iPad Air 11″ M4",
    text: "Magic Keyboard для iPad Air 11″ (M4/M3/M2). Для этой диагонали подходит только 11‑дюймовая версия.",
  },
  {
    slug: "ipad-air-13-m4",
    keyboard: "Magic Keyboard для iPad Air 13″ M4",
    text: "Magic Keyboard для iPad Air 13″ (M4/M3/M2). Для этой диагонали подходит только 13‑дюймовая версия.",
  },
  {
    slug: "ipad-a16",
    keyboard: "Magic Keyboard Folio для iPad A16",
    text: "Magic Keyboard Folio для iPad A16. Magic Keyboard для iPad Air или iPad Pro к этой модели не подходит.",
  },
  {
    slug: "ipad-mini-a17-pro",
    keyboard: null,
    text: "Фирменной Magic Keyboard со Smart Connector для iPad mini (A17 Pro) нет. Подойдут отдельные Bluetooth‑клавиатуры, но их нет в текущем ассортименте.",
  },
] as const;

function imagesFor(product: AppleKeyboardProduct) {
  const images = [...new Set(product.variants.map((variant) => variant.image))];
  const colorImages: Record<string, string[]> = {};
  for (const variant of product.variants) {
    colorImages[variant.color] = [variant.image];
    colorImages[variantImageKey({ color: variant.color, memory: null, region: null })] = [variant.image];
  }
  return { images, colorImages };
}

function planVariants(existing: ExistingVariant[], product: AppleKeyboardProduct) {
  const remaining = [...existing];
  const options = product.variants.map((option) => {
    const byLabel = remaining.findIndex((variant) => variant.rawLabel === option.rawLabel);
    const byColor = remaining.findIndex((variant) => variant.color === option.color);
    const index = byLabel >= 0 ? byLabel : byColor;
    return { option, existing: index >= 0 ? remaining.splice(index, 1)[0] : null };
  });
  return { options, remaining };
}

async function syncProduct(tx: Transaction, categoryId: string, product: AppleKeyboardProduct) {
  const existing = await tx.product.findUnique({
    where: { slug: product.slug },
    include: { variants: { orderBy: { updatedAt: "desc" } } },
  });
  const plan = planVariants(existing?.variants ?? [], product);
  if (dryRun) {
    return `PLAN ${product.name}: ${product.variants.length} вариантов`;
  }

  const { images, colorImages } = imagesFor(product);
  const data = {
    name: product.name,
    brand: "Apple",
    categoryId,
    status: "PUBLISHED" as const,
    description: product.description,
    highlights: product.highlights,
    specs: product.specs,
    images,
    colorImages,
  };
  const saved = existing
    ? await tx.product.update({ where: { id: existing.id }, data })
    : await tx.product.create({ data: { slug: product.slug, ...data } });

  if (plan.remaining.length > 0) {
    const archive = await tx.product.upsert({
      where: { slug: `${product.slug}-archive-variants` },
      create: {
        slug: `${product.slug}-archive-variants`,
        name: `${product.name} — архив вариантов`,
        brand: "Apple",
        categoryId,
        status: "HIDDEN",
      },
      update: { categoryId, status: "HIDDEN" },
    });
    await tx.productVariant.updateMany({
      where: { id: { in: plan.remaining.map((variant) => variant.id) } },
      data: { productId: archive.id },
    });
  }

  for (const { option, existing: existingVariant } of plan.options) {
    const variantData = {
      productId: saved.id,
      memory: null,
      color: option.color,
      region: null,
      rawLabel: option.rawLabel,
      price: option.price,
      inStock: true,
    };
    if (existingVariant) {
      await tx.productVariant.update({ where: { id: existingVariant.id }, data: variantData });
    } else {
      await tx.productVariant.create({ data: variantData });
    }
  }

  const variants = await tx.productVariant.findMany({ where: { productId: saved.id } });
  if (variants.length !== product.variants.length) {
    throw new Error(`${product.name}: варианты сохранены не полностью. Транзакция отменена.`);
  }
  return `OK   ${product.name}: ${product.variants.length} вариантов`;
}

function specsObject(value: Prisma.JsonValue | null): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const specs: Record<string, Prisma.JsonValue> = {};
  for (const [key, item] of Object.entries(value as Prisma.JsonObject)) {
    if (item !== undefined) specs[key] = item;
  }
  return specs;
}

async function syncIpadCompatibility(tx: Transaction): Promise<string[]> {
  const messages: string[] = [];
  for (const item of IPAD_KEYBOARD_COMPATIBILITY) {
    const ipad = await tx.product.findUnique({
      where: { slug: item.slug },
      select: { id: true, name: true, specs: true },
    });
    if (!ipad) throw new Error(`Не найден ${item.slug}: сначала синхронизируйте каталог iPad.`);
    if (!dryRun) {
      await tx.product.update({
        where: { id: ipad.id },
        data: {
          specs: {
            ...specsObject(ipad.specs),
            "Совместимая клавиатура": item.text,
          },
        },
      });
    }
    messages.push(`${dryRun ? "PLAN" : "OK  "} ${ipad.name}: ${item.keyboard ?? "клавиатура через Bluetooth"}`);
  }
  return messages;
}

async function main() {
  await Promise.all(Object.values(APPLE_KEYBOARD_ASSETS).map((photo) =>
    access(path.join(process.cwd(), "public", photo.slice(1))),
  ));

  const messages = await prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({ where: { slug: "planshety" } });
    if (!category) throw new Error("Категория planshety не найдена.");

    const log: string[] = [];
    for (const product of APPLE_KEYBOARD_CATALOG) {
      log.push(await syncProduct(tx, category.id, product));
    }
    log.push(...await syncIpadCompatibility(tx));

    if (!dryRun) {
      const saved = await tx.product.findMany({
        where: { slug: { in: APPLE_KEYBOARD_CATALOG.map((product) => product.slug) } },
        include: { variants: true },
      });
      if (saved.length !== APPLE_KEYBOARD_CATALOG.length) {
        throw new Error("Создана не каждая карточка Magic Keyboard. Транзакция отменена.");
      }
    }
    return log;
  }, { isolationLevel: "Serializable", timeout: 60000 });

  for (const message of messages) console.log(message);
  console.log(dryRun ? "DRY RUN: база не изменялась." : "Готово: клавиатуры и совместимость iPad синхронизированы.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
