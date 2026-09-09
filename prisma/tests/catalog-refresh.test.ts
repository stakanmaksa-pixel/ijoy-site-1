import {test} from "node:test";
import assert from "node:assert/strict";
import {access,readFile} from "node:fs/promises";
import {samsungMemoryColorGrid,isSamsungPhone,isIpadKeyboard,directModelLink} from "../../src/lib/catalogPresentation";
import {planRefreshVariants,shouldHideForRefresh} from "../data/catalog-refresh-policy";
import {SAMSUNG_TABLETS,SAMSUNG_TABLET_ACCESSORIES} from "../data/samsung-tablet-catalog";
import {SAMSUNG_WATCH_CATALOG} from "../data/samsung-watch-catalog";
import {GOOGLE_PIXEL_CATALOG} from "../data/google-pixel-catalog";
import {XIAOMI_PHONE_CATALOG} from "../data/xiaomi-phone-catalog";
import {SONY_XPERIA_CATALOG} from "../data/sony-xperia-catalog";
import {getCompatibleAccessoryBundle} from "../../src/lib/compatibleAccessories";

test("Samsung menu targets modifications directly and phone classification excludes tablets/watches/accessories",()=>{
  for(const slug of ["samsung-galaxy-s26-ultra","samsung-galaxy-s26","samsung-galaxy-s25-ultra","samsung-galaxy-z-fold8"]) {
    assert(isSamsungPhone(slug));
    assert.equal(directModelLink({name:slug,slug}).href,`/product/${slug}`);
  }
  for(const slug of ["samsung-galaxy-tab-s11","samsung-galaxy-watch-9","samsung-s-pen-s11","samsung-book-cover-keyboard-s11","ipad-pro-11-m5"])assert(!isSamsungPhone(slug),slug);
  assert(isIpadKeyboard("magic-keyboard-ipad-pro-11-m5"));
  assert(isIpadKeyboard("magic-keyboard-folio-ipad-a16"));
});
test("Samsung collapses regional duplicates, retains original IDs as aliases, and never mutates offers",()=>{
  const base={memory:"256GB",color:"Black",region:"EU",price:50000,inStock:true};
  const offers=[{...base,id:"eu"},{...base,id:"hk",region:"HK",price:49000},{...base,id:"cheap-oos",price:45000,inStock:false},{...base,id:"1tb",memory:"1TB"},{...base,id:"512",memory:"512GB"},{...base,id:"silver",color:"Silver",price:null,inStock:false}];
  const before=JSON.stringify(offers), result=samsungMemoryColorGrid(offers);
  assert.equal(JSON.stringify(offers),before);
  assert.equal(result.variants.length,4);
  assert(result.variants.every(v=>v.region===null));
  assert.equal(result.aliases.eu,"hk");assert.equal(result.aliases['cheap-oos'],"hk");
  assert.equal(result.variants[0].price,49000);
  assert.deepEqual(result.variants.map(v=>v.memory),["256GB","256GB","512GB","1TB"]);
  assert.deepEqual(samsungMemoryColorGrid([]),{variants:[],aliases:{}});
});
test("all new catalogues have unique axes, original local photos, descriptions and sources",async()=>{
  const products=[...SAMSUNG_TABLETS,...SAMSUNG_TABLET_ACCESSORIES,...SAMSUNG_WATCH_CATALOG,...GOOGLE_PIXEL_CATALOG,...XIAOMI_PHONE_CATALOG,...SONY_XPERIA_CATALOG];
  assert.equal(new Set(products.map(p=>p.slug)).size,products.length);
  assert.equal(SAMSUNG_TABLETS.length,8);assert.equal(SAMSUNG_TABLET_ACCESSORIES.length,8);
  assert.equal(GOOGLE_PIXEL_CATALOG.length,5);assert.equal(SONY_XPERIA_CATALOG.length,1);
  for(const p of products){
    assert(p.description.length>50 && p.highlights.length>=3 && p.sources.length>0,p.slug);
    assert.equal(new Set(p.variants.map(v=>JSON.stringify([v.memory,v.color,v.region]))).size,p.variants.length,p.slug);
    for(const image of new Set(p.variants.flatMap(v=>[v.image,...(v.images??[])])))await access(new URL(`../../public${image}`,import.meta.url));
    assert(p.variants.every(v=>!('price' in v)&&!('inStock' in v)),p.slug);
  }
});
test("Samsung tablet recommendations use the correct diagonals and never sell S Pen as required for A11",()=>{
  const accessorySlugs=new Set(SAMSUNG_TABLET_ACCESSORIES.map(p=>p.slug));
  for(const p of SAMSUNG_TABLETS){
    const bundle=getCompatibleAccessoryBundle(p.slug);
    if(p.slug.includes("tab-a11")){assert.equal(bundle,null);assert(p.specs["Стилус"].includes("не поддерживается"));}
    else {assert.equal(bundle?.slugs.length,2);assert(bundle?.description.includes("уже входит"));for(const s of bundle!.slugs)assert(accessorySlugs.has(s));}
  }
  assert.deepEqual(getCompatibleAccessoryBundle("samsung-galaxy-tab-s10-lite")?.slugs,["samsung-book-cover-keyboard-s10-fe","samsung-s-pen-s10-lite"]);
});
test("sync planning is idempotent and preserves prices, stock, IDs and raw labels",()=>{
  const product=SAMSUNG_TABLETS[0];
  const existing=product.variants.map((v,i)=>({...v,id:`old-${i}`,price:i?null:"74500",inStock:i===0,rawLabel:`supplier ${i}`}));
  const before=JSON.stringify(existing);
  const plan=planRefreshVariants(existing,product);
  assert.equal(plan.remaining.length,0);assert(plan.options.every(o=>o.existing));
  assert.equal(plan.options[0].existing?.price,"74500");
  assert.equal(JSON.stringify(existing),before);
});
test("storage-only prices map only to unambiguous RAM configurations",()=>{
  const base = SONY_XPERIA_CATALOG[0];
  const old = [{id:"priced",memory:"256GB",color:"Slate Black",region:"EU",price:100000,inStock:true}];
  const plan = planRefreshVariants(old,base);
  assert.equal(plan.options.find(o=>o.existing)?.option.memory,"12/256GB");
  assert.equal(plan.remaining.length,0);
  assert.throws(()=>planRefreshVariants([{...old[0],memory:"512GB"}],base),/Ambiguous RAM/);
  assert.equal(planRefreshVariants([{...old[0],memory:"12/256"}],base).options.find(o=>o.existing)?.option.memory,"12/256GB");
});
test("archiving is limited to old Samsung tablets, Watch7, OnePlus watches, and other Sony phones",()=>{
  const allowed=new Set(SAMSUNG_TABLETS.map(p=>p.slug));
  const item=(name:string,slug:string,brand:string,category:string)=>({name,slug,brand,category:{slug:category}});
  assert(shouldHideForRefresh(item("Samsung Galaxy Tab S9","samsung-galaxy-tab-s9","Samsung","planshety"),allowed));
  assert(shouldHideForRefresh(item("Samsung Galaxy Watch 7","samsung-galaxy-watch-7","Samsung","chasy"),allowed));
  assert(shouldHideForRefresh(item("OnePlus Watch 3","oneplus-watch-3","OnePlus","chasy"),allowed));
  for(const p of SAMSUNG_TABLETS)assert(!shouldHideForRefresh({...p,category:{slug:p.category}},allowed));
  assert(!shouldHideForRefresh(item("Samsung S Pen для Tab S11","samsung-s-pen-s11","Samsung","planshety"),allowed));
  assert(!shouldHideForRefresh(item("OnePlus 15","oneplus-15","OnePlus","telefony"),allowed));
  assert(!shouldHideForRefresh(item("Sony Xperia 1 VII","sony-xperia-1-vii","Sony","telefony"),allowed));
});
test("keyboard color cards use exact variant links and region filters omit Samsung phones",async()=>{
  const catalog=await readFile(new URL('../../src/lib/catalog.ts',import.meta.url),'utf8');
  assert(catalog.includes('cardVariantId: variant.id'));
  assert(catalog.includes('exactPrice: true'));
  assert(catalog.includes('!isSamsungPhone(product.slug)'));
});
