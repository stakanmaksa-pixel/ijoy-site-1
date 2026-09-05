// Точечная проверка критичных исправлений после развёртывания.
// Скрипт ничего не меняет: он завершается с кодом 2, если есть хотя бы одна
// ошибка, поэтому "успешный" запуск означает, что данные и файлы совпали.
//
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/verify-critical-catalog.ts

import "dotenv/config";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { variantImageKey } from "../../src/lib/pickCoverImage";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const failures: string[] = [];

async function assertFile(productName: string, publicPath: string | undefined) {
  if (!publicPath?.startsWith("/uploads/")) {
    failures.push(`${productName}: нет пути к фото`);
    return;
  }
  try {
    await access(path.join(process.cwd(), "public", publicPath.slice(1)));
  } catch {
    failures.push(`${productName}: файл не найден (${publicPath})`);
  }
}

async function fileHash(publicPath: string | undefined) {
  if (!publicPath?.startsWith("/uploads/")) return null;
  try {
    const contents = await readFile(path.join(process.cwd(), "public", publicPath.slice(1)));
    return createHash("sha256").update(contents).digest("hex");
  } catch {
    return null;
  }
}

async function checkAppleTv() {
  const product = await prisma.product.findFirst({
    where: { name: "Apple TV 4K (3-го поколения)" },
    include: { variants: { orderBy: { memory: "asc" } } },
  });
  if (!product) {
    failures.push("Apple TV: товар не найден");
    return;
  }
  const actual = product.variants.map((variant) => `${variant.memory}:${variant.price?.toString() ?? "null"}`).sort();
  const expected = ["128GB:19900", "64GB:15900"];
  if (actual.length !== expected.length || actual.some((value, index) => value !== expected[index])) {
    failures.push(`Apple TV: ожидались ${expected.join(", ")}, получены ${actual.join(", ") || "нет вариантов"}`);
  } else {
    console.log("OK   Apple TV: ровно 64 ГБ и 128 ГБ с корректными ценами");
  }
  for (const image of product.images) await assertFile(product.name, image);
}

async function checkAirPods() {
  const oldMaxPublished = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      AND: [
        { name: { contains: "AirPods Max", mode: "insensitive" } },
        { NOT: { name: { contains: "AirPods Max 2", mode: "insensitive" } } },
      ],
    },
    select: { name: true },
  });
  if (oldMaxPublished.length) failures.push(`Старые AirPods Max всё ещё опубликованы: ${oldMaxPublished.map((item) => item.name).join(", ")}`);
  else console.log("OK   Старые AirPods Max скрыты");

  const expectedNames = ["AirPods Pro 3", "AirPods Pro 2", "AirPods 4 ANC", "AirPods 4", "AirPods Max 2", "Apple EarPods USB-C"];
  for (const expectedName of expectedNames) {
    const candidates = await prisma.product.findMany({
      where: { status: "PUBLISHED", name: { contains: expectedName, mode: "insensitive" } },
      include: { variants: true },
    });
    // "AirPods 4" является частью названия модели ANC, поэтому для обычной
    // версии берём только строку без ANC. Иначе проверка могла бы зелёным
    // отметить одно фото дважды и не заметить отсутствующее второе.
    const product = expectedName === "AirPods 4"
      ? candidates.find((item) => !/anc/i.test(item.name))
      : candidates[0];
    if (!product) {
      failures.push(`${expectedName}: опубликованный товар не найден`);
      continue;
    }
    if (expectedName === "AirPods Max 2") {
      const byColor = (product.colorImages as Record<string, string[]> | null) ?? {};
      const hashes = new Set<string>();
      for (const variant of product.variants) {
        const photo = variant.color ? byColor[variant.color]?.[0] : undefined;
        await assertFile(`${product.name}, ${variant.color ?? "без цвета"}`, photo);
        const hash = await fileHash(photo);
        if (hash) hashes.add(hash);
      }
      const colors = new Set(product.variants.map((variant) => variant.color).filter(Boolean));
      if (hashes.size !== colors.size) failures.push(`${product.name}: цвета используют одинаковые фотографии`);
      console.log(`OK   ${product.name}: проверены фото ${product.variants.length} цветов`);
    } else {
      await assertFile(product.name, product.images[0]);
      console.log(`OK   ${product.name}: есть фото`);
    }
  }
}

async function checkWatches() {
  for (const slug of ["apple-watch-ultra-3", "apple-watch-series-11", "apple-watch-se-3"]) {
    const product = await prisma.product.findUnique({ where: { slug }, include: { variants: true } });
    if (!product) {
      failures.push(`${slug}: товар не найден`);
      continue;
    }
    if (slug === "apple-watch-ultra-3") {
      if (!product.description || !product.specs || product.highlights.length < 3) {
        failures.push("Apple Watch Ultra 3: отсутствуют описание, характеристики или ключевые преимущества");
      } else {
        console.log("OK   Apple Watch Ultra 3: описание и характеристики заполнены");
      }
    }
    const byVariant = (product.colorImages as Record<string, string[]> | null) ?? {};
    for (const variant of product.variants) {
      const photo = byVariant[variantImageKey(variant)]?.[0];
      await assertFile(`${product.name}, ${variant.color ?? "без цвета"}, ${variant.region ?? "без ремешка"}`, photo);
    }

    const colors = [...new Set(product.variants.map((variant) => variant.color).filter((value): value is string => Boolean(value)))];
    const hashes = new Set<string>();
    for (const color of colors) {
      const photo = byVariant[color]?.[0];
      await assertFile(`${product.name}, цвет ${color}`, photo);
      const hash = await fileHash(photo);
      if (hash) hashes.add(hash);
    }
    if (hashes.size !== colors.length) failures.push(`${product.name}: разные цвета корпуса используют одинаковое фото`);
    else console.log(`OK   ${product.name}: точные фото вариантов и ${colors.length} разных цветов корпуса`);
  }
}

async function main() {
  await checkAppleTv();
  await checkAirPods();
  await checkWatches();
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 2;
  } else {
    console.log("\nПРОВЕРКА ПРОЙДЕНА: данные и обязательные фото на месте.");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
