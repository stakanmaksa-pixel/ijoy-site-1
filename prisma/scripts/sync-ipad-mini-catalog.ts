// Targeted, repeatable update; no deletes, no invented prices, no changes to TV variants.
// Add --dry-run to preview the exact archive targets and variant counts without writing.
import "dotenv/config";
import { access } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import { variantImageKey } from "../../src/lib/pickCoverImage";
import {
  MINI_SLUG, MINI_NAME, MINI_OPTIONS, MINI_CONTENT, MINI_IMAGES, MINI_COLOR_IMAGES, TV_PHOTO,
  isMiniProduct, shouldArchiveTablet, planMiniVariants,
} from "../data/ipad-mini-catalog";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const photos = new Set([TV_PHOTO, ...Object.values(MINI_COLOR_IMAGES).flat()]);
  await Promise.all([...photos].map(photo => access(path.join(process.cwd(), "public", photo.slice(1)))));
  // One transaction includes the read/plan/merge/archive/verification steps.
  const messages = await prisma.$transaction(async tx => {
    const products = await tx.product.findMany({
      where: { category: { slug: { in: ["planshety", "tv-pristavki"] } } },
      include: { category: { select: { slug: true } }, variants: true },
    });
    const minis = products.filter(isMiniProduct);
    let primary = minis.find(product => product.slug === MINI_SLUG);
    const archive = products.filter(shouldArchiveTablet);
    const tvs = products.filter(product => product.category.slug === "tv-pristavki" && product.name === "Apple TV 4K (3-го поколения)");
    if (!tvs.length) throw new Error("Не найдена Apple TV 4K (3-го поколения). Изменения не применены: сначала проверьте название карточки.");
    const plan = planMiniVariants(minis.flatMap(product => product.variants), primary?.id);
    const log = [
      `${dryRun ? "PLAN" : "OK"} iPad mini: 24 комбинации; сохранено существующих вариантов ${plan.options.filter(item => item.existing).length}, новых без цены ${plan.options.filter(item => !item.existing).length}`,
      ...archive.map(product => `${dryRun ? "PLAN" : "HIDDEN"} ${product.name} (${product.slug})`),
      ...minis.filter(product => product.id !== primary?.id).map(product => `${dryRun ? "PLAN" : "MERGED"} Дубликат mini: ${product.name} (${product.slug})`),
      `ARCHIVE: сохранено дополнительных вариантов mini: ${plan.remaining.length}`,
      `${dryRun ? "PLAN" : "OK"} Apple TV: фото приставки с Siri Remote; цены и варианты не изменены`,
    ];
    if (dryRun) return log;
    const category = await tx.category.findUniqueOrThrow({ where: { slug: "planshety" } });
    const content = { ...MINI_CONTENT, status: "PUBLISHED" as const, categoryId: category.id, images: MINI_IMAGES, colorImages: MINI_COLOR_IMAGES };
    if (primary) {
      await tx.product.update({ where: { id: primary.id }, data: content });
    } else {
      primary = await tx.product.create({ data: { slug: MINI_SLUG, ...content }, include: { category: { select: { slug: true } }, variants: true } });
    }
    const canonicalExtras = plan.remaining.filter(variant => variant.productId === primary.id);
    if (canonicalExtras.length) {
      const bucket = await tx.product.upsert({
        where: { slug: `${MINI_SLUG}-archive-variants` },
        create: { slug: `${MINI_SLUG}-archive-variants`, name: `${MINI_NAME} — архив вариантов`, brand: "Apple", categoryId: category.id, status: "HIDDEN" },
        update: { status: "HIDDEN" },
      });
      await tx.productVariant.updateMany({ where: { id: { in: canonicalExtras.map(variant => variant.id) } }, data: { productId: bucket.id } });
    }
    for (const { option, existing } of plan.options) {
      if (existing) {
        await tx.productVariant.update({ where: { id: existing.id }, data: { productId: primary.id, ...option } });
      } else {
        await tx.productVariant.create({ data: { productId: primary.id, ...option, price: null, inStock: false } });
      }
    }
    const hiddenIds = [...archive, ...minis.filter(product => product.id !== primary.id)].map(product => product.id);
    await tx.product.updateMany({ where: { id: { in: hiddenIds } }, data: { status: "HIDDEN" } });
    for (const tv of tvs) {
      const colorImages = Object.fromEntries(tv.variants.map(variant => [variantImageKey(variant), [TV_PHOTO]]));
      await tx.product.update({ where: { id: tv.id }, data: { images: [TV_PHOTO], colorImages } });
    }
    const result = await tx.productVariant.findMany({ where: { productId: primary.id } });
    const keys = new Set(result.map(variantImageKey));
    if (result.length !== 24 || MINI_OPTIONS.some(option => !keys.has(variantImageKey(option)))) {
      throw new Error("Проверка mini не пройдена: ожидалось ровно 24 уникальных варианта. Транзакция отменена.");
    }
    return log;
  }, { timeout: 60000, isolationLevel: "Serializable" });
  for (const message of messages) console.log(message);
  console.log(dryRun ? "DRY RUN: база не изменялась" : "Готово. Архив находится среди скрытых товаров в админке. Перезапустите app для обновления кэша меню.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
