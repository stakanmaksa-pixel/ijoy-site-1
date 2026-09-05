// Точечная проверка критичных исправлений после развёртывания.
// Скрипт ничего не меняет: он завершается с кодом 2, если есть хотя бы одна
// ошибка, поэтому "успешный" запуск означает, что данные и файлы совпали.
//
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/verify-critical-catalog.ts

import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

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

  const expectedNames = ["AirPods Pro 3", "AirPods Pro 2", "AirPods 4 ANC", "AirPods 4", "AirPods Max 2"];
  for (const expectedName of expectedNames) {
    const product = await prisma.product.findFirst({
      where: { status: "PUBLISHED", name: { contains: expectedName, mode: "insensitive" } },
      include: { variants: true },
    });
    if (!product) {
      failures.push(`${expectedName}: опубликованный товар не найден`);
      continue;
    }
    if (expectedName === "AirPods Max 2") {
      const byColor = (product.colorImages as Record<string, string[]> | null) ?? {};
      for (const variant of product.variants) {
        const photo = variant.color ? byColor[variant.color]?.[0] : undefined;
        await assertFile(`${product.name}, ${variant.color ?? "без цвета"}`, photo);
      }
      console.log(`OK   ${product.name}: проверены фото ${product.variants.length} цветов`);
    } else {
      await assertFile(product.name, product.images[0]);
      console.log(`OK   ${product.name}: есть фото`);
    }
  }
}

async function main() {
  await checkAppleTv();
  await checkAirPods();
  if (failures.length) {
    for (const failure of failures) console.error(`FAIL ${failure}`);
    process.exitCode = 2;
  } else {
    console.log("\nПРОВЕРКА ПРОЙДЕНА: данные и обязательные фото на месте.");
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
