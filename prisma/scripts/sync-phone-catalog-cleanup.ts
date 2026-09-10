import "dotenv/config";
import {access,mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import {PrismaPg} from "@prisma/adapter-pg";
import {Prisma,PrismaClient} from "../../src/generated/prisma/client";
import {POCO_M8_CATALOG} from "../data/poco-m8-catalog";
import {planPhoneEnrichment} from "../data/phone-enrichment-policy";
import {shouldHideOldScreenshotPhone} from "../data/phone-cleanup-policy";

const dryRun=process.argv.includes("--dry-run");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
async function main(){
  for(const p of POCO_M8_CATALOG)for(const v of p.variants)for(const src of [v.image,...(v.images??[])]){
    if(!src.startsWith("/catalog/product-photos/phones/")||src.includes(".."))throw Error(`Invalid image: ${src}`);
    await access(path.join(process.cwd(),"public",src));
  }
  await prisma.$transaction(async tx=>{
    const current=await tx.product.findMany({where:{status:"PUBLISHED",category:{slug:"telefony"}},include:{variants:true,category:true}});
    const hide=current.filter(shouldHideOldScreenshotPhone);
    const work=POCO_M8_CATALOG.flatMap(product=>{
      const old=current.find(p=>p.slug===product.slug);
      if(!old){console.log(`SKIP ${product.slug}: missing or hidden`);return [];}
      return [{product,old,plan:planPhoneEnrichment(old.variants,product)}];
    });
    if(!hide.length&&!work.length)throw Error("No published target phones found.");
    for(const p of hide)console.log(`HIDE ${p.name}: offers, prices and IDs retained`);
    for(const {product,plan} of work)console.log(`FILL ${product.name}: ${plan.updates.length} retained, ${plan.create.length} new unpriced, ${plan.archive.length} empty placeholders archived`);
    if(dryRun){console.log("DRY RUN: база не изменялась.");return;}
    const folder=path.resolve("backups/phone-cleanup");await mkdir(folder,{recursive:true});
    const backup=path.join(folder,`phones-${Date.now()}.json`);
    await writeFile(backup,JSON.stringify([...hide,...work.map(w=>w.old)],null,2),{flag:"wx"});
    console.log(`Backup: ${backup}`);
    for(const p of hide)await tx.product.update({where:{id:p.id},data:{status:"HIDDEN"}});
    for(const {product,old,plan} of work){
      await tx.product.update({where:{id:old.id},data:{description:product.description,highlights:product.highlights,specs:product.specs,images:plan.images,colorImages:plan.colorImages}});
      for(const v of plan.updates)await tx.productVariant.update({where:{id:v.id},data:{memory:v.memory,color:v.color}});
      for(const v of plan.create)await tx.productVariant.create({data:{productId:old.id,memory:v.memory,color:v.color,region:v.region,price:null,inStock:false,rawLabel:`phone-cleanup: ${product.slug} ${v.memory} ${v.color}`}});
      if(plan.archive.length){
        const archive=await tx.product.upsert({where:{slug:`${product.slug}-enrichment-archive`},create:{slug:`${product.slug}-enrichment-archive`,name:`${product.name} — архив незаполненных вариантов`,brand:old.brand,categoryId:old.categoryId,status:"HIDDEN"},update:{status:"HIDDEN"}});
        await tx.productVariant.updateMany({where:{id:{in:plan.archive.map(v=>v.id)}},data:{productId:archive.id}});
      }
    }
    console.log(`Готово: скрыто ${hide.length}, заполнено ${work.length}. Цены и наличие сохранены.`);
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000});
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
