/** Fixed owner-approved feed. Default is a read-only plan; --apply is atomic, with a durable backup. */
import "dotenv/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { canonicalIphoneModel, parsePriceListText } from "../../src/lib/priceImport";
import { planApprovedPriceCatalog, type PriceCatalogProduct } from "../../src/lib/approvedPriceCatalog";
import { october27Category, planOctober27Prices, OCTOBER27_MARKUPS } from "../../src/lib/ownerPriceOctober27";
import { variantImageKey } from "../../src/lib/pickCoverImage";
import { october27ApprovedProducts } from "../data/owner-price-october27-additions";
import photoSources from "../data/owner-price-october27-photo-sources.json";

const sourcePath = "prisma/data/owner-price-2026-10-27.txt";
const approvedSha256 = "6dc9fb52d1130367c982d4e0c51cd2782819868ec1678b52f4044bd0843d36b0";
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const candidates = (products: PriceCatalogProduct[]) => products.flatMap(product => product.variants.map(variant => ({
  ...variant, productName: product.name, productSlug: product.slug, chip: product.chip,
})));

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => !["--apply", "--verify", "--plan-only", "--dry-run"].includes(arg))) throw Error("Укажите один режим: --apply, --verify, --plan-only или --dry-run. Без флага — только проверка.");
  const apply = args.includes("--apply"), verify = args.includes("--verify");
  const input = await readFile(sourcePath, "utf8");
  if (sha(input.replace(/\r\n/g, "\n")) !== approvedSha256) throw Error("Изменился согласованный прайс 27.10.2026; применение запрещено.");
  const lines = parsePriceListText(input);
  const requirements = october27ApprovedProducts(input);
  for (const image of photoSources) {
    if (!image.file.startsWith("/catalog/product-photos/owner-price-2026-10-27/")) throw Error("Некорректный путь фото");
    const bytes = await readFile(path.join("public", image.file.slice(1)));
    if (sha(bytes) !== image.sha256) throw Error(`Фото изменилось: ${image.file}`);
  }
  if (args.includes("--plan-only")) {
    console.log(JSON.stringify({ sourcePath, markups: OCTOBER27_MARKUPS, approvedAdditions: requirements, rows: lines.map(line => ({ source: line.rawLine, scope: october27Category(line), retail: october27Category(line) ? line.parsedPrice! + october27Category(line)!.markup : null })) }, null, 2));
    return;
  }
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL не задан; база не изменена. Без базы доступен --plan-only.");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const committed = await prisma.$transaction(async tx => {
      const load = () => tx.product.findMany({ include: { category: true, variants: { include: { _count: { select: { orderItems: true } } }, orderBy: { id: "asc" } } }, orderBy: { id: "asc" } });
      type Stored = Awaited<ReturnType<typeof load>>;
      const convert = (stored: Stored): PriceCatalogProduct[] => stored.map(product => ({
        id: product.id, slug: product.slug, name: product.name, brand: product.brand, category: product.category.slug,
        chip: /\b(?:M\d(?:\s*(?:Pro|Max|Ultra))?|A\d+(?:\s*Pro)?)\b/i.exec([
          product.specs && typeof product.specs === "object" && !Array.isArray(product.specs) ? product.specs["Процессор"] ?? product.specs["Чип"] ?? "" : "",
          product.name, product.description,
        ].join(" "))?.[0] ?? null,
        variants: product.variants.map(variant => ({ ...variant, price: variant.price === null ? null : Number(variant.price), orderCount: variant._count.orderItems })),
      }));
      const before = await load();
      const phoneIds = before.filter(product => ["iPhone 18 Pro", "iPhone 18 Pro Max"].includes(canonicalIphoneModel(product.name) ?? "")).flatMap(product => product.variants.map(variant => variant.id));
      const references = phoneIds.length ? await tx.priceImportLine.findMany({ where: { matchedVariantId: { in: phoneIds } }, select: { matchedVariantId: true } }) : [];
      const prepared = planApprovedPriceCatalog(convert(before), requirements, new Set(references.map(row => row.matchedVariantId).filter((id): id is string => Boolean(id))));
      const plan = planOctober27Prices(lines, candidates(prepared.products));
      const unmatched = plan.decisions.filter(decision => !decision.variantId);
      const counts: Record<string, { matched: number; total: number }> = {};
      for (const decision of plan.decisions) {
        const group = counts[decision.category] ??= { matched: 0, total: 0 };
        group.total++;
        if (decision.variantId) group.matched++;
      }
      console.log("Прайс 27.10.2026. Отсутствующие в нём цены сохраняются. Старые Max/S10 и ранее отклонённые варианты исключены.");
      for (const [category, count] of Object.entries(counts)) console.log(`${category}: ${count.matched}/${count.total}`);
      for (const operation of prepared.operations) console.log(`ПОДГОТОВКА: ${JSON.stringify(operation)}`);
      const reportMissing = () => { for (const decision of unmatched) console.log(`НЕТ СОВПАДЕНИЯ: ${decision.line.rawLine} — ${decision.reason}`); };
      const stock = new Map(prepared.products.flatMap(product => product.variants.map(variant => [variant.id, variant.inStock] as const)));
      const priced = plan.changes.map(change => ({ ...change, newStock: prepared.approvedStockIds.has(change.variant.id) ? true : stock.get(change.variant.id)! }));
      if (verify) {
        reportMissing();
        const wrong = priced.filter(change => change.variant.price !== change.newPrice || stock.get(change.variant.id) !== change.newStock);
        if (prepared.operations.length || unmatched.length || wrong.length || !priced.length) throw Error(`Проверка не пройдена: подготовка ${prepared.operations.length}, без совпадения ${unmatched.length}, неверных цен/наличия ${wrong.length}. База не изменена.`);
        console.log(`ПРОВЕРЕНО: ${priced.length} цен по прайсу 27.10.2026; SIM и согласованные варианты присутствуют.`);
        return;
      }
      for (const change of priced) console.log(`ЦЕНА: ${change.variant.productName} / ${change.variant.memory ?? ""} / ${change.variant.color ?? ""} / ${change.variant.region ?? ""}: ${change.variant.price ?? "—"} → ${change.newPrice} ₽`);
      reportMissing();
      if (!apply) { console.log(`DRY RUN: ${priced.length} цен, ${prepared.operations.length} операций подготовки, ${unmatched.length} строк требуют проверки. База не изменена.`); return; }
      if (unmatched.length || !priced.length) throw Error("Есть не сопоставленные строки либо нет цен. Никаких изменений в базу не внесено; пришлите строки НЕТ СОВПАДЕНИЯ.");
      const changed = priced.some(change => change.variant.price !== change.newPrice || stock.get(change.variant.id) !== change.newStock);
      if (!prepared.operations.length && !changed) { console.log(`УЖЕ ПРИМЕНЕНО: все ${priced.length} цен совпадают; повторная запись не нужна.`); return; }

      const touchedIds = new Set(priced.map(change => change.variant.id));
      const touchedProducts = before.filter(product => product.variants.some(variant => touchedIds.has(variant.id)) || prepared.operations.some(operation => (operation.kind === "variant" && operation.productId === product.id) || ((operation.kind === "sim" || operation.kind === "sku") && product.variants.some(variant => variant.id === operation.id))));
      const backupDir = path.resolve("backups/owner-price-2026-10-27");
      await mkdir(backupDir, { recursive: true });
      const backup = path.join(backupDir, `before-${Date.now()}.json`);
      await writeFile(backup, JSON.stringify({ sourcePath, approvedSha256, before: touchedProducts, operations: prepared.operations, prices: priced }, null, 2), { flag: "wx" });
      console.log(`BACKUP ${backup}`);
      const ids = new Map<string, string>();
      const actualId = (id: string) => ids.get(id) ?? id;
      for (const operation of prepared.operations) {
        if (operation.kind === "product") {
          const requirement = operation.product;
          const category = await tx.category.upsert({ where: { slug: requirement.category }, update: {}, create: { slug: requirement.category, name: requirement.categoryName, sortOrder: 55 } });
          const product = await tx.product.create({ data: { slug: requirement.slug, name: requirement.name, brand: requirement.brand, categoryId: category.id, status: "PUBLISHED", ...requirement.create! } });
          ids.set(operation.id, product.id);
        } else if (operation.kind === "variant") {
          const option = operation.variant;
          const variant = await tx.productVariant.create({ data: { productId: actualId(operation.productId), memory: option.memory, color: option.color, region: option.region, sku: option.sku ?? null, rawLabel: option.rawLabel ?? null, price: null, inStock: false } });
          ids.set(operation.id, variant.id);
        } else if (operation.kind === "sim") {
          const updated = await tx.productVariant.updateMany({ where: { id: operation.id, region: null, sku: null, rawLabel: null, price: null, inStock: false, orderItems: { none: {} } }, data: { region: operation.region } });
          if (updated.count !== 1) throw Error("Общий вариант iPhone изменился; вся транзакция отменена");
        } else {
          const updated = await tx.productVariant.updateMany({ where: { id: operation.id, sku: null }, data: { sku: operation.sku } });
          if (updated.count !== 1) throw Error("Артикул изменился; вся транзакция отменена");
        }
      }
      for (const productId of new Set(prepared.photos.map(photo => actualId(photo.productId)))) {
        const product = await tx.product.findUniqueOrThrow({ where: { id: productId } });
        if (product.colorImages !== null && (Array.isArray(product.colorImages) || typeof product.colorImages !== "object")) throw Error("Некорректная карта фото; транзакция отменена");
        const colorImages = { ...(product.colorImages as Record<string, string[]> | null ?? {}) };
        const photos = prepared.photos.filter(photo => actualId(photo.productId) === productId);
        let fill = !product.images.length;
        for (const photo of photos) {
          const key = variantImageKey(photo);
          if (!colorImages[key]?.length) { colorImages[key] = [photo.image]; fill = true; }
        }
        if (fill) await tx.product.update({ where: { id: productId }, data: { images: product.images.length ? product.images : [photos[0].image], colorImages } });
      }
      const materialized = await load();
      const actualPlan = planOctober27Prices(lines, candidates(convert(materialized)));
      const expected = new Map(priced.map(change => [actualId(change.variant.id), change]));
      if (actualPlan.decisions.some(decision => !decision.variantId) || actualPlan.changes.length !== expected.size || actualPlan.changes.some(change => expected.get(change.variant.id)?.newPrice !== change.newPrice)) throw Error("План после подготовки отличается; вся транзакция отменена");
      for (const change of actualPlan.changes) {
        const target = expected.get(change.variant.id)!;
        const updated = await tx.productVariant.updateMany({ where: { id: change.variant.id, price: change.variant.price, inStock: stock.get(target.variant.id)! }, data: { price: new Prisma.Decimal(change.newPrice), inStock: target.newStock } });
        if (updated.count !== 1) throw Error(`Цена ${change.variant.id} изменилась; вся транзакция отменена`);
      }
      const after = await load();
      const afterVariants = new Map(after.flatMap(product => product.variants.map(variant => [variant.id, variant] as const)));
      for (const [id, target] of expected) {
        const actual = afterVariants.get(id);
        if (!actual || Number(actual.price) !== target.newPrice || actual.inStock !== target.newStock) throw Error("Проверка записанных цен не пройдена; транзакция отменена");
      }
      for (const product of before) for (const variant of product.variants) {
        const actual = afterVariants.get(variant.id);
        if (!actual || (!expected.has(variant.id) && (actual.price?.toString() !== variant.price?.toString() || actual.inStock !== variant.inStock))) throw Error("Изменилось отсутствующее в прайсе предложение; транзакция отменена");
      }
      return { prices: expected.size, operations: prepared.operations.length };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 });
    if (committed) console.log(`ГОТОВО: ${committed.prices} цен и ${committed.operations} операций подготовки применены одной транзакцией и проверены.`);
  } finally { await prisma.$disconnect(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
