// Оставляет в витрине только согласованные линейки Samsung из меню. Цены,
// варианты, фото и история заказов не меняются: устаревшие карточки просто
// переводятся в черновики, поэтому их можно безопасно вернуть при необходимости.
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-samsung-phone-menu.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  getSamsungPhoneMenuGroup,
  isAllowedSamsungPhone,
  SAMSUNG_PHONE_MENU_GROUPS,
} from "../../src/lib/samsungPhones";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: "telefony" } });
  if (!category) throw new Error("Категория telefony не найдена.");

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, brand: "Samsung" },
    select: { id: true, slug: true, name: true, status: true },
  });
  const keep = products.filter((product) => isAllowedSamsungPhone(product.name, product.slug));
  const archive = products.filter((product) => !isAllowedSamsungPhone(product.name, product.slug));

  if (!keep.length) {
    throw new Error("Не найдено ни одной согласованной модели Samsung. База не изменялась.");
  }

  if (dryRun) {
    for (const product of keep) {
      console.log(`PLAN KEEP    ${product.name} → ${getSamsungPhoneMenuGroup(product.name, product.slug)?.label}`);
    }
    for (const product of archive) console.log(`PLAN ARCHIVE ${product.name}`);
    console.log("DRY RUN: база не изменялась.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.updateMany({
      where: { id: { in: keep.map((product) => product.id) } },
      data: { status: "PUBLISHED" },
    });
    if (archive.length) {
      await tx.product.updateMany({
        where: { id: { in: archive.map((product) => product.id) } },
        data: { status: "DRAFT" },
      });
    }

    const remaining = await tx.product.findMany({
      where: { categoryId: category.id, brand: "Samsung", status: "PUBLISHED" },
      select: { name: true, slug: true },
    });
    if (remaining.some((product) => !isAllowedSamsungPhone(product.name, product.slug))) {
      throw new Error("Проверка Samsung не пройдена: в витрине осталась лишняя модель.");
    }
  }, { isolationLevel: "Serializable" });

  const presentGroups = new Set(keep.map((product) => getSamsungPhoneMenuGroup(product.name, product.slug)?.label));
  for (const group of SAMSUNG_PHONE_MENU_GROUPS) {
    if (!presentGroups.has(group.label)) {
      console.log(`INFO  ${group.label}: карточки пока нет в текущем прайсе, поэтому пункт не показывается.`);
    }
  }
  console.log(`Готово: опубликовано ${keep.length} моделей Samsung, скрыто ${archive.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
