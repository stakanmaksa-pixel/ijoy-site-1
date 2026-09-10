// Scoped, repeatable content/photo update; no prices, stock, SKUs or IDs reset.
import "dotenv/config";
import {access,mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {PrismaPg} from "@prisma/adapter-pg";
import {Prisma,PrismaClient} from "../../src/generated/prisma/client";
import {ANDROID_PHONE_CATALOG} from "../data/android-phone-catalog";
import {XIAOMI_PHONE_CATALOG} from "../data/xiaomi-phone-catalog";
import {planPhoneEnrichment} from "../data/phone-enrichment-policy";

const catalog=[...XIAOMI_PHONE_CATALOG,...ANDROID_PHONE_CATALOG];
const dryRun=process.argv.includes("--dry-run");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
async function main(){
  for(const p of catalog)for(const v of p.variants)for(const image of [v.image,...(v.images??[])]){
    if(!image.startsWith("/catalog/product-photos/phones/")||image.includes(".."))throw Error(`Invalid photo ${image}`);
    await access(path.join(process.cwd(),"public",image));
  }
  await prisma.$transaction(async tx=>{
    const existing=await tx.product.findMany({where:{slug:{in:catalog.map(p=>p.slug)}},include:{variants:true,category:true}});
    // Compute ALL plans before the first write; a protected unrecognized offer
    // aborts the whole update, not a partially modified catalogue.
    const work=catalog.flatMap(product=>{
      const current=existing.find(p=>p.slug===product.slug);
      if(!current||current.status!=="PUBLISHED"){console.log(`SKIP ${product.slug}: missing or not published`);return [];}
      if(current.category.slug!=="telefony")throw Error(`Unexpected category: ${product.slug}`);
      return [{product,current,plan:planPhoneEnrichment(current.variants,product)}];
    });
    for(const {product,plan}of work)console.log(`${dryRun?"PLAN":"SYNC"} ${product.name}: ${plan.updates.length} retained offers, ${plan.create.length} new unpriced offers, ${plan.archive.length} obsolete empty placeholders`);
    if(dryRun){console.log("DRY RUN: база не изменялась.");return;}
    if(!work.length)throw Error("No published target phones found; nothing to update.");
    const backupDir=path.resolve("backups/phone-enrichment");
    await mkdir(backupDir,{recursive:true});
    const backup=path.join(backupDir,`phones-${Date.now()}.json`);
    await writeFile(backup,JSON.stringify(work.map(w=>w.current),null,2),{flag:"wx"});
    console.log(`Backup: ${backup}`);
    for(const {product,current,plan}of work){
      await tx.product.update({where:{id:current.id},data:{description:product.description,highlights:product.highlights,specs:product.specs,images:plan.images,colorImages:plan.colorImages}});
      for(const v of plan.updates){
        const old=current.variants.find(o=>o.id===v.id)!;
        if(old.memory!==v.memory||old.color!==v.color)await tx.productVariant.update({where:{id:v.id},data:{memory:v.memory,color:v.color}});
      }
      for(const v of plan.create)await tx.productVariant.create({data:{productId:current.id,memory:v.memory,color:v.color,region:v.region,price:null,inStock:false,rawLabel:`phone-enrichment: ${product.slug} ${v.memory} ${v.color}`}});
      if(plan.archive.length){
        const archive=await tx.product.upsert({where:{slug:`${product.slug}-enrichment-archive`},create:{slug:`${product.slug}-enrichment-archive`,name:`${product.name} — архив незаполненных вариантов`,brand:current.brand,categoryId:current.categoryId,status:"HIDDEN"},update:{status:"HIDDEN"}});
        await tx.productVariant.updateMany({where:{id:{in:plan.archive.map(v=>v.id)}},data:{productId:archive.id}});
      }
    }
    console.log(`Готово: ${work.length} моделей. Цены, наличие и идентификаторы сохранены.`);
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000});
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
