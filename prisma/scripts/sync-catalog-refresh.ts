// Safe, repeatable catalogue refresh. New offers are unpriced and unavailable.
// Existing prices, stock flags, SKUs, offer IDs and order references are preserved.
import "dotenv/config";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { SAMSUNG_TABLETS, SAMSUNG_TABLET_ACCESSORIES } from "../data/samsung-tablet-catalog";
import { SAMSUNG_WATCH_CATALOG } from "../data/samsung-watch-catalog";
import { GOOGLE_PIXEL_CATALOG } from "../data/google-pixel-catalog";
import { XIAOMI_PHONE_CATALOG } from "../data/xiaomi-phone-catalog";
import { SONY_XPERIA_CATALOG } from "../data/sony-xperia-catalog";
import { identity, planRefreshVariants, shouldHideForRefresh } from "../data/catalog-refresh-policy";
import type { RefreshProduct } from "../data/catalog-refresh-types";
import { variantImageKey } from "../../src/lib/pickCoverImage";

const products: RefreshProduct[] = [...SAMSUNG_TABLETS, ...SAMSUNG_TABLET_ACCESSORIES, ...SAMSUNG_WATCH_CATALOG, ...GOOGLE_PIXEL_CATALOG, ...XIAOMI_PHONE_CATALOG, ...SONY_XPERIA_CATALOG];
const dryRun = process.argv.includes("--dry-run");
const prisma = new PrismaClient({adapter: new PrismaPg({connectionString: process.env.DATABASE_URL})});

async function main() {
  for (const product of products) {
    if (!product.variants.length || !product.sources.length) throw new Error(`Incomplete product: ${product.slug}`);
    for (const variant of product.variants) for (const image of [variant.image, ...(variant.images ?? [])]) {
      if (!image.startsWith("/catalog/product-photos/")) throw new Error(`Invalid local photo: ${image}`);
      await access(path.join(process.cwd(), "public", image));
    }
  }
  await prisma.$transaction(async tx => {
    const existing = await tx.product.findMany({include: {variants: true, category: true}});
    const allowed = new Set(SAMSUNG_TABLETS.map(p => p.slug));
    const targetIds = new Set(products.flatMap(p => existing.filter(e => e.slug === p.slug || p.aliases?.includes(e.slug) || e.brand === p.brand && e.category.slug === p.category && identity(e.name) === identity(p.name)).map(e => e.id)));
    const archived = existing.filter(p => !targetIds.has(p.id) && shouldHideForRefresh(p, allowed));
    if (!dryRun) {
      const backupDir = path.resolve("backups/catalog-refresh");
      await mkdir(backupDir, {recursive:true});
      // Contains product/offer data only, never customers, orders or credentials.
      const snapshot = existing.filter(p => targetIds.has(p.id) || archived.some(a => a.id === p.id));
      const backup = path.join(backupDir, `catalog-refresh-${Date.now()}.json`);
      await writeFile(backup, JSON.stringify(snapshot, null, 2), {flag:"wx"});
      console.log(`Backup: ${backup}`);
    }
    for (const product of products) {
      const category = await tx.category.findUnique({where: {slug: product.category}});
      if (!category) throw new Error(`Missing category ${product.category}`);
      const matches = existing.filter(e => e.slug === product.slug || product.aliases?.includes(e.slug) || e.brand === product.brand && e.category.slug === product.category && identity(e.name) === identity(product.name));
      const current = matches.find(e => e.slug === product.slug) ?? matches[0];
      const plan = planRefreshVariants(matches.flatMap(e => e.variants), product);
      console.log(`${dryRun ? "PLAN" : "SYNC"} ${product.name}: ${plan.options.filter(v=>v.existing).length} existing, ${plan.options.filter(v=>!v.existing).length} new, ${plan.remaining.length} archived offers`);
      if (dryRun) continue;
      const colorImages: Record<string,string[]> = {};
      for (const v of product.variants) {
        const gallery = [...new Set([v.image, ...(v.images ?? [])])];
        if (v.color) colorImages[v.color] = gallery;
        colorImages[variantImageKey(v)] = gallery;
      }
      const data = {name:product.name, brand:product.brand, categoryId:category.id, description:product.description, highlights:product.highlights, specs:product.specs, images:[...new Set(product.variants.flatMap(v=>[v.image,...(v.images??[])]))], colorImages, status:"PUBLISHED" as const};
      // Reuse the product and offer IDs; only duplicate model records are hidden.
      const saved = current
        ? await tx.product.update({where:{id:current.id},data:{slug:product.slug,...data}})
        : await tx.product.create({data:{slug:product.slug,...data}});
      for (const {option, existing: previous} of plan.options) {
        const axes = {productId:saved.id,memory:option.memory,color:option.color,region:option.region};
        if (previous) await tx.productVariant.update({where:{id:previous.id},data:axes});
        else await tx.productVariant.create({data:{...axes,price:null,inStock:false,rawLabel:`catalog-refresh: ${product.slug} ${option.memory??""} ${option.color??""} ${option.region??""}`}});
      }
      if (plan.remaining.length) {
        const archive = await tx.product.upsert({where:{slug:`${product.slug}-archive-variants`},create:{slug:`${product.slug}-archive-variants`,name:`${product.name} — архив вариантов`,brand:product.brand,categoryId:category.id,status:"HIDDEN"},update:{status:"HIDDEN"}});
        await tx.productVariant.updateMany({where:{id:{in:plan.remaining.map(v=>v.id)}},data:{productId:archive.id}});
      }
      await tx.product.updateMany({where:{id:{in:matches.filter(m=>m.id!==saved.id).map(m=>m.id)}},data:{status:"HIDDEN"}});
    }
    console.log(`Hide: ${archived.map(p=>p.name).join(", ") || "none"}`);
    if (!dryRun) await tx.product.updateMany({where:{id:{in:archived.map(p=>p.id)}},data:{status:"HIDDEN"}});
  }, {isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000});
  console.log(dryRun ? "DRY RUN: база не изменялась." : "Готово. Цены и наличие существующих предложений сохранены.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
