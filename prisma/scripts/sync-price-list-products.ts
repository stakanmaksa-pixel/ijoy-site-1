// Создаёт отсутствующие карточки и варианты из согласованной части прайса.
// Существующие товары/цены не перезаписывает. Запуск:
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-price-list-products.ts --dry-run
// Убери --dry-run для записи в каталог.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { normalizeForMatch } from "../../src/lib/priceImport";
import { PRICE_LIST_PRODUCTS } from "../data/price-list-products";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const output = await prisma.$transaction(async (tx) => {
    const messages: string[] = [];
    for (const entry of PRICE_LIST_PRODUCTS) {
      const category = await tx.category.findUnique({ where: { slug: entry.category } });
      if (!category) throw new Error(`Не найдена категория ${entry.category}`);

      const existingProduct = await tx.product.findUnique({
        where: { slug: entry.slug },
        include: { variants: true },
      });
      if (existingProduct && existingProduct.categoryId !== category.id) {
        throw new Error(`${entry.slug}: товар уже находится в другой категории`);
      }

      let savedProductId = existingProduct?.id ?? null;
      let added = 0;
      for (const option of entry.variants) {
        const bySku = option.sku
          ? await tx.productVariant.findUnique({ where: { sku: option.sku } })
          : null;
        if (bySku && bySku.productId !== existingProduct?.id) {
          throw new Error(`${option.sku}: SKU уже используется другим товаром`);
        }
        const byLabel = existingProduct?.variants.find(
          (variant) => variant.rawLabel != null && normalizeForMatch(variant.rawLabel) === normalizeForMatch(option.rawLabel),
        );
        if (bySku || byLabel) continue;
        added += 1;
        if (dryRun) continue;

        if (!savedProductId) {
          const createdProduct = await tx.product.create({
            data: {
              slug: entry.slug,
              name: entry.name,
              brand: entry.brand,
              description: entry.description,
              status: "PUBLISHED",
              categoryId: category.id,
            },
          });
          savedProductId = createdProduct.id;
        }
        await tx.productVariant.create({
          data: {
            productId: savedProductId,
            color: option.color ?? null,
            sku: option.sku ?? null,
            price: new Prisma.Decimal(option.price),
            inStock: true,
            rawLabel: option.rawLabel,
          },
        });
      }

      if (!existingProduct && !dryRun && added === 0) {
        throw new Error(`${entry.slug}: карточка не создана, хотя новых вариантов нет`);
      }
      messages.push(`${dryRun ? "PLAN" : "OK"} ${entry.name}: ${added} новых вариантов`);
    }
    return messages;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });

  for (const message of output) console.log(message);
  console.log(dryRun ? "DRY RUN: база не изменялась." : "Готово: недостающие карточки каталога созданы.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
