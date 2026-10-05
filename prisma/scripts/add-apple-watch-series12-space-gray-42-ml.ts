// Adds only the missing Apple Watch Series 12 42 mm Space Gray M/L option.
// Dry-run is the default; pass --apply to append the unpriced variant.
import "dotenv/config";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { parsePriceListText } from "../../src/lib/priceImport";
import { SEPTEMBER_2026_PRODUCTS } from "../data/september-2026-catalog";

const slug = "apple-watch-series-12";
const wanted = { memory: "42 мм", color: "Space Gray", region: "Navy Blue Sport Band M/L" };
const sku = "MJE94";
const source = readFileSync(path.resolve("prisma/data/owner-price-2026-10-04.txt"), "utf8");
const apply = process.argv.includes("--apply");
const approvedHash = process.argv.find((arg) => arg.startsWith("--approve="))?.slice(10);
const normalize = (value: string | null) => (value ?? "").toLowerCase().replace(/[\s‑–—_-]+/g, "");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL не задан");

  const template = SEPTEMBER_2026_PRODUCTS.find((product) => product.slug === slug);
  const variant = template?.variants.find((item) =>
    item.memory === wanted.memory && item.color === wanted.color && item.region === wanted.region,
  );
  if (!template || !variant) throw new Error("Нужный вариант отсутствует в каталоге проекта");
  const offers = parsePriceListText(source).filter((line) => line.parsedSku === sku);
  if (offers.length !== 1 || offers[0].phoneModel || offers[0].parsedMemory !== wanted.memory ||
    offers[0].parsedColor !== wanted.color || offers[0].parsedRegion !== "M/L" ||
    !offers[0].parsedPrice || offers[0].parsedPrice <= 0) {
    throw new Error(`Исходная строка Apple Watch ${sku} изменилась или неоднозначна`);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const existing = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });
    if (!existing) throw new Error(`На сайте не найден товар ${slug}; ничего не изменено`);
    const sameCase = existing.variants.filter((item) =>
      normalize(item.memory) === normalize(variant.memory) && normalize(item.color) === normalize(variant.color));
    const sameFit = sameCase.filter((item) => /(?:^|\s)M\/L$/i.test(item.region ?? ""));
    if (sameFit.length > 1) throw new Error("Найдено несколько вариантов Space Gray 42 мм M/L; требуется ручная проверка");
    if (sameFit.length === 1 && normalize(sameFit[0].region) !== normalize(variant.region)) {
      throw new Error("Уже есть Space Gray 42 мм M/L с другим ремешком; автоматическое добавление запрещено");
    }

    const alreadyExists = existing.variants.some((item) =>
      normalize(item.memory) === normalize(variant.memory) &&
      normalize(item.color) === normalize(variant.color) &&
      normalize(item.region) === normalize(variant.region),
    );
    if (alreadyExists) {
      console.log("Вариант уже есть; база не изменена.");
      return;
    }
    const skuHolder = await prisma.productVariant.findUnique({ where: { sku } });
    if (skuHolder) throw new Error(`Артикул ${sku} уже закреплён за другим вариантом`);
    const hash = createHash("sha256").update(JSON.stringify({ source, productId: existing.id, sameCase, wanted, sku })).digest("hex").slice(0, 16);

    console.log(`${apply ? "ADD" : "DRY RUN"} ${existing.name}: ${variant.memory}, ${variant.color}, ${variant.region}`);
    console.log(`Контрольный код добавления: ${hash}`);
    console.log("Цена и наличие останутся пустыми, чтобы следующий прайс сопоставил строку без перезаписи данных.");
    if (!apply) {
      console.log("Для добавления повторите запуск с --apply --approve=<контрольный код>.");
      return;
    }
    if (approvedHash !== hash) throw new Error("Контрольный код не совпал; база не изменена");

    const backupDir = path.resolve("backups/apple-watch-series12-space-gray-42-ml");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-${Date.now()}.json`);
    await writeFile(backupPath, JSON.stringify({ slug, sku, sourceLine: offers[0].rawLine, hash, before: existing }, null, 2), { flag: "wx" });

    await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({ where: { slug }, include: { variants: true } });
      if (!current) throw new Error(`Товар ${slug} исчез до записи`);
      const conflictingFit = current.variants.some((item) =>
        normalize(item.memory) === normalize(variant.memory) &&
        normalize(item.color) === normalize(variant.color) &&
        /(?:^|\s)M\/L$/i.test(item.region ?? ""),
      );
      if (conflictingFit) throw new Error("Модификация M/L появилась после проверки; вся операция отменена");
      if (await tx.productVariant.findUnique({ where: { sku } })) throw new Error(`Артикул ${sku} занят`);
      await tx.productVariant.create({
        data: {
          productId: current.id,
          sku,
          memory: variant.memory,
          color: variant.color,
          region: variant.region,
          price: null,
          inStock: false,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    console.log(`Добавлено. Резервная копия: ${backupPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
