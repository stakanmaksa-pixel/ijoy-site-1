import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { IPHONE18_PRICES, planIphone18Prices } from "../data/iphone18-prices";
const prisma = new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
const dryRun = process.argv.includes("--dry-run");
async function main() {
  await prisma.$transaction(async tx=>{
    const products = await tx.product.findMany({where:{slug:{in:Object.keys(IPHONE18_PRICES)}},include:{variants:true,category:true}});
    if (products.length !== 2 || products.some(p=>p.category.slug!=="telefony")) throw Error("Обе модели iPhone 18 должны существовать в категории Телефоны.");
    const plans=products.map(p=>({product:p,plan:planIphone18Prices(p.slug,p.variants)}));
    for(const {product,plan} of plans) console.log(`${product.name}: обновить ${plan.updates.length}, добавить ${plan.creates.length}; eSIM / SIM+eSIM.`);
    if(dryRun){console.log("DRY RUN: без изменений.");return;}
    const folder=path.resolve("backups/iphone18-prices");
    await mkdir(folder,{recursive:true});
    const backup=path.join(folder,`before-${Date.now()}.json`);
    await writeFile(backup,JSON.stringify(products,null,2),{flag:"wx"});
    console.log(`Backup: ${backup}`);
    for(const {product,plan} of plans){
      for(const {id,...data} of plan.updates) await tx.productVariant.update({where:{id},data});
      if(plan.creates.length) await tx.productVariant.createMany({data:plan.creates.map(v=>({...v,productId:product.id}))});
      const specs=product.specs && typeof product.specs==="object" && !Array.isArray(product.specs) ? product.specs : {};
      await tx.product.update({where:{id:product.id},data:{
        specs:{...specs,"SIM":"Варианты поставки: SIM + eSIM или eSIM. Выберите нужный тип при покупке."},
        description:product.description?.replace(/цену и доступность в нашем магазине уточняйте у менеджера\./i,"В наличии с 23 сентября.") ?? product.description,
      }});
    }
    console.log("Готово: 64 варианта, цены обновлены. Фото, ID существующих вариантов и остатки сохранены. Duo не изменён.");
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:120000});
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>prisma.$disconnect());
