// Safe by default: --apply updates A20 Pro and hides the owner's retired A17 Pro; never deletes records.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { validateMiniA20Photo } from "./download-ipad-mini-a20-pro-photos";
import { MINI_A20_SLUG, MINI_A20_NAME, MINI_A20_SOURCES, MINI_A20_CONTENT, MINI_A20_VARIANTS, MINI_A20_IMAGES, MINI_A20_COLOR_IMAGES, MINI_A20_PHOTO_ASSETS, RETIRED_MINI_A17_SLUGS, isRetiredMiniA17Product, miniA20OptionKey, planMiniA20Addition } from "../data/ipad-mini-a20-pro-catalog";

async function main() {
  const args = new Set(process.argv.slice(2));
  if ([...args].some(arg => !["--apply", "--dry-run", "--plan-only"].includes(arg)) || args.size > 1) throw Error("Укажите один режим: --plan-only, --dry-run или --apply. Без флага выполняется только dry-run.");
  for (const photo of MINI_A20_PHOTO_ASSETS) validateMiniA20Photo(await readFile(path.join(process.cwd(), "public", photo.file.slice(1))));
  if (args.has("--plan-only")) {
    console.log(JSON.stringify({ mode: "PLAN ONLY — без подключения к базе", slug: MINI_A20_SLUG, ...MINI_A20_CONTENT, variants: MINI_A20_VARIANTS, photos: MINI_A20_PHOTO_ASSETS, sources: MINI_A20_SOURCES, retirement: { slugs: RETIRED_MINI_A17_SLUGS, status: "HIDDEN", deletes: false } }, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL не задан. База не изменялась. Для проверки без базы используйте --plan-only.");
  const apply = args.has("--apply");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    await prisma.$transaction(async tx => {
      const category = await tx.category.findUniqueOrThrow({ where: { slug: "planshety" } });
      const aliases = await tx.product.findMany({ where: { OR: [
        { slug: MINI_A20_SLUG }, { name: { in: [MINI_A20_NAME, "Apple iPad mini (A20 Pro)", "iPad mini (A20 Pro)"] } },
      ] }, include: { variants: true } });
      if (aliases.length > 1 || aliases.some(item => item.slug !== MINI_A20_SLUG)) throw Error("Обнаружена другая карточка iPad mini A20 Pro. Сначала проверьте дубликаты вручную; ничего не объединяю.");
      const old = aliases[0];
      if (old && (old.categoryId !== category.id || old.brand !== "Apple")) throw Error("Карточка с таким slug относится к другой категории или бренду. Изменения отменены.");
      const variantsToCreate = planMiniA20Addition(old?.variants ?? []);
      const tabletIdentities = await tx.product.findMany({
        where: { categoryId: category.id, brand: { equals: "Apple", mode: "insensitive" } },
        select: { id: true, slug: true, name: true, brand: true, status: true, category: { select: { slug: true } } },
      });
      const retire = tabletIdentities.filter(item => item.status !== "HIDDEN" && isRetiredMiniA17Product(item));
      console.log(`${old ? "UPDATE" : "CREATE"} ${MINI_A20_NAME}: новых конфигураций ${variantsToCreate.length}, всего 20. Новые — без цены и без подтверждённого наличия.`);
      for (const item of retire) console.log(`${apply ? "HIDE" : "PLAN HIDE"} ${item.name} (${item.slug}): только скрытие, без удаления вариантов, цен и заказов.`);
      if (!apply) { console.log("DRY RUN: база и резервные копии не изменялись."); return; }

      const directory = path.resolve("backups/ipad-mini-a20-pro");
      await mkdir(directory, { recursive: true });
      const backup = path.join(directory, `before-${Date.now()}.json`);
      const retiredBefore = retire.length ? await tx.product.findMany({ where: { id: { in: retire.map(item => item.id) } }, include: { variants: true } }) : [];
      await writeFile(backup, JSON.stringify({ target: MINI_A20_SLUG, before: old ?? null, retiredBefore, sources: MINI_A20_SOURCES }, null, 2), { flag: "wx" });
      console.log(`BACKUP ${backup}`);
      // Preserve owner photographs when the target already has its own gallery.
      const images = old?.images.length ? old.images : MINI_A20_IMAGES;
      const oldColors = old?.colorImages;
      if (oldColors != null && (typeof oldColors !== "object" || Array.isArray(oldColors))) throw Error("Некорректный colorImages; требуется ручная проверка.");
      const colorImages = { ...MINI_A20_COLOR_IMAGES, ...(oldColors ?? {}) };
      const content = { ...MINI_A20_CONTENT, images, colorImages };
      const product = old
        ? await tx.product.update({ where: { id: old.id }, data: { ...content, variants: { create: variantsToCreate } } })
        : await tx.product.create({ data: { slug: MINI_A20_SLUG, ...content, categoryId: category.id, status: "PUBLISHED", variants: { create: variantsToCreate } } });

      const after = await tx.productVariant.findMany({ where: { productId: product.id } });
      const keys = new Set(after.map(miniA20OptionKey));
      if (after.length !== 20 || keys.size !== 20 || keys.has(null) || MINI_A20_VARIANTS.some(option => !keys.has(miniA20OptionKey(option)))) throw Error("Проверка 20 конфигураций не пройдена. Транзакция отменена.");
      for (const before of old?.variants ?? []) {
        const current = after.find(item => item.id === before.id);
        if (!current || current.price?.toString() !== before.price?.toString() || current.inStock !== before.inStock || current.memory !== before.memory || current.color !== before.color || current.region !== before.region || current.sku !== before.sku || current.rawLabel !== before.rawLabel) throw Error("Существующее предложение изменилось. Транзакция отменена.");
      }
      if (retire.length) {
        const hidden = await tx.product.updateMany({ where: { id: { in: retire.map(item => item.id) }, categoryId: category.id }, data: { status: "HIDDEN" } });
        if (hidden.count !== retire.length) throw Error("Не все старые mini скрыты. Транзакция отменена.");
        const remaining = await tx.product.count({ where: { id: { in: retire.map(item => item.id) }, status: { not: "HIDDEN" } } });
        if (remaining) throw Error("Проверка скрытия A17 Pro не пройдена. Транзакция отменена.");
      }
      console.log(`OK ${MINI_A20_SLUG}: 20 конфигураций. Скрыто старых mini A17 Pro: ${retire.length}. Варианты, история заказов, цены и наличие сохранены.`);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 60000 });
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1] && /(?:^|[\\/])sync-ipad-mini-a20-pro-catalog\.ts$/.test(process.argv[1])) {
  main().catch(error => { console.error(error); process.exitCode = 1; });
}
