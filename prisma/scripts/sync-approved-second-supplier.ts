// Create only the product families explicitly approved for the second feed.
// Prices remain unconfirmed until the owner accepts a Telegram import batch.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { approvedSecondSupplierProducts } from "../data/approved-second-supplier";
import { normalizeForMatch, supplierIdentityKey } from "../../src/lib/priceImport";

const fileNames = [
  "second-supplier-2026-10-02.txt",
  "second-supplier-dyson-2026-10-02.txt",
];
const fixtureDir = path.resolve("prisma/tests/fixtures");
const products = approvedSecondSupplierProducts(...fileNames.map((name) => readFileSync(path.join(fixtureDir, name), "utf8")));
const apply = process.argv.includes("--apply");

const categoryLabels: Record<string, string> = {
  aksessuary: "Аксессуары",
  chasy: "Часы",
  daisony: "Дайсоны",
  "fitnes-braslety": "Фитнес-браслеты",
  "ekshn-kamery": "Экшн-камеры",
  naushniki: "Наушники",
  noutbuki: "Ноутбуки",
  "portativnaya-akustika": "Портативная акустика",
};
const categorySortOrders: Record<string, number> = {
  aksessuary: 5,
  chasy: 2,
  daisony: 4,
  "ekshn-kamery": 50,
  "fitnes-braslety": 46,
  naushniki: 35,
  noutbuki: 6,
  "portativnaya-akustika": 47,
};

function sameVariant(a: { memory: string | null; color: string | null; region: string | null; rawLabel: string | null }, b: { memory: string | null; color: string | null; region: string | null; rawLabel: string }): boolean {
  const aIdentity = supplierIdentityKey(a.rawLabel);
  const bIdentity = supplierIdentityKey(b.rawLabel);
  if (aIdentity && bIdentity && aIdentity === bIdentity) return true;
  return Boolean(a.memory || a.color || a.region) &&
    normalizeForMatch(a.memory ?? "") === normalizeForMatch(b.memory ?? "") &&
    normalizeForMatch(a.color ?? "") === normalizeForMatch(b.color ?? "") &&
    normalizeForMatch(a.region ?? "") === normalizeForMatch(b.region ?? "");
}

async function main() {
  console.log(`Одобрено: ${products.length} моделей, ${products.reduce((sum, product) => sum + product.variants.length, 0)} модификаций.`);
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (apply) throw new Error("DATABASE_URL не задан; база не изменена");
    console.log("Без DATABASE_URL показан только план по прайсу; существующие товары в базе не проверены.");
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const slugs = products.map((product) => product.slug);
    const names = products.map((product) => product.name);
    const [categories, oldProducts] = await Promise.all([
      prisma.category.findMany({ where: { slug: { in: [...new Set(products.map((product) => product.category))] } } }),
      prisma.product.findMany({ where: { OR: [{ slug: { in: slugs } }, { name: { in: names } }] }, include: { variants: true, category: true } }),
    ]);
    const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
    const missingCategories = [...new Set(products.map((product) => product.category))]
      .filter((slug) => !categoryBySlug.has(slug));
    if (missingCategories.length) {
      console.log(`Новые категории для одобренных товаров: ${missingCategories.map((slug) => categoryLabels[slug] ?? slug).join(", ")}`);
    }

    const plans = products.map((product) => {
      const bySlug = oldProducts.find((old) => old.slug === product.slug);
      const byName = oldProducts.find((old) => old.name === product.name);
      if (bySlug && byName && bySlug.id !== byName.id) throw new Error(`${product.name}: неоднозначные карточки сайта`);
      if (bySlug && bySlug.name !== product.name) throw new Error(`${product.name}: занятый адрес карточки принадлежит другой модели`);
      const old = bySlug ?? byName ?? null;
      if (old && old.category.slug !== product.category) throw new Error(`${product.name}: категория сайта не совпала, запись остановлена`);
      const toCreate = product.variants.filter((variant) => !old?.variants.some((existing) => sameVariant(existing, variant)));
      console.log(`${old ? "UPDATE" : "CREATE"} ${product.name}: ${toCreate.length} новых вариантов`);
      return { product, old, toCreate };
    });
    if (!apply) {
      console.log("DRY RUN: база не изменена. Для записи нужен флаг --apply.");
      return;
    }
    if (!plans.some((plan) => !plan.old || plan.toCreate.length)) {
      console.log("Все одобренные товары уже на сайте; изменений нет.");
      return;
    }

    const backupDir = path.resolve("backups/approved-second-supplier");
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `before-${Date.now()}.json`);
    await writeFile(backupPath, JSON.stringify({ products, before: oldProducts }, null, 2), { flag: "wx" });

    await prisma.$transaction(async (tx) => {
      for (const slug of missingCategories) {
        const category = await tx.category.upsert({
          where: { slug },
          create: { slug, name: categoryLabels[slug] ?? slug, sortOrder: categorySortOrders[slug] ?? 100 },
          update: {},
        });
        categoryBySlug.set(slug, category);
      }
      for (const { product, old, toCreate } of plans) {
        const variants = toCreate.map((variant) => ({ ...variant, price: null, inStock: false }));
        if (old) {
          for (const variant of variants) await tx.productVariant.create({ data: { ...variant, productId: old.id } });
          continue;
        }
        await tx.product.create({ data: {
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          categoryId: categoryBySlug.get(product.category)!.id,
          description: `${product.name}. Выберите модификацию и уточните комплектацию у менеджера.`,
          status: "PUBLISHED",
          variants: { create: variants },
        } });
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    console.log(`Готово. Резервная копия создана: ${backupPath}`);
    console.log("Цены не применены: отправьте прайс боту и подтвердите совпадения в панели сайта.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
