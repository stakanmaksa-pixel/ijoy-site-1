import assert from "node:assert/strict";
import {test} from "node:test";
import {access,readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {renderToStaticMarkup} from "react-dom/server";
import {ANDROID_PHONE_CATALOG} from "../data/android-phone-catalog";
import {XIAOMI_PHONE_CATALOG} from "../data/xiaomi-phone-catalog";
import {planPhoneEnrichment} from "../data/phone-enrichment-policy";
import {pickCoverImage,pickVariantImages} from "../../src/lib/pickCoverImage";
import {catalogPhotoBounds} from "../../src/lib/catalogPhotos";
import {colorLabel,colorToHex} from "../../src/lib/colorSwatch";
import {ProductCard} from "../../src/components/ProductCard";
import {ProductDetail} from "../../src/components/ProductDetail";
import {VariantCard} from "../../src/components/VariantCard";
import {OFFICIAL_CATALOG_ENTRIES,officialVariants} from "../official-catalog";

const products=[...XIAOMI_PHONE_CATALOG,...ANDROID_PHONE_CATALOG];
test("every enriched photo has a traceable source and unchanged original bytes",async()=>{
  const manifest=JSON.parse(await readFile(new URL('../data/phone-enrichment-photo-sources.json',import.meta.url),'utf8'));
  const entries=manifest.entries as {asset:string;source:string;url:string;sha256:string}[];
  assert.equal(entries.length,170);
  const byAsset=new Map(entries.map(e=>[e.asset,e]));
  for(const image of new Set(products.flatMap(p=>p.variants.flatMap(v=>[v.image,...(v.images??[])])))){
    const entry=byAsset.get(image);assert(entry,image);
    assert(entry.source.startsWith('https://'));assert(entry.url.startsWith('https://'));
    const bytes=await readFile(new URL('../../public'+image,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,image);
  }
});
test("all 38 targeted phones have translated color-specific photos and useful specifications",async()=>{
  assert.equal(ANDROID_PHONE_CATALOG.length,23);assert.equal(products.length,38);
  for(const p of products){
    assert(p.description.length>120,p.slug);assert(Object.keys(p.specs).length>=10,p.slug);
    const photos=new Map<string,string>();
    const axes=new Set<string>();
    for(const v of p.variants){
      assert(v.memory&&v.color,p.slug);assert(!('price' in v));assert(!('inStock' in v));
      const key=JSON.stringify([v.memory,v.color,v.region]);assert(!axes.has(key));axes.add(key);
      assert(!v.image.includes('-colors.'),p.slug);
      const previous=photos.get(v.color!);if(previous)assert.equal(previous,v.image);photos.set(v.color!,v.image);
      assert.notEqual(colorLabel(v.color),v.color,v.color!);assert.notEqual(colorToHex(v.color),'#c7c7cc',v.color!);
    }
    assert.equal(new Set(photos.values()).size,photos.size,p.slug+' must not reuse another color photo');
    for(const url of new Set(p.variants.flatMap(v=>[v.image,...(v.images??[])]))){
      await access(new URL('../../public'+url,import.meta.url));assert(catalogPhotoBounds(url),url);
    }
  }
});
test("Poco black and red stay different across list, exact variant and detail gallery",()=>{
  const p=XIAOMI_PHONE_CATALOG.find(p=>p.slug==='poco-f9-ultra')!;
  const plan=planPhoneEnrichment([],p);
  for(const color of ['Black','Red']){
    const v=p.variants.find(v=>v.color===color)!;
    assert.equal(pickCoverImage(plan.images,plan.colorImages,color),v.image);
    assert.deepEqual(pickVariantImages(plan.images,plan.colorImages,v),v.images);
    const variants=p.variants.map((v,i)=>({...v,id:String(i),price:null,inStock:false}));
    const html=renderToStaticMarkup(<ProductDetail productName={p.name} productSlug={p.slug} variants={variants} initialVariantId={variants.find(v=>v.color===color)!.id} images={plan.images} colorImages={plan.colorImages}/>);
    assert(html.includes(v.image));assert(!html.includes(`phones/poco-f9-ultra-${color==='Red'?'black':'red'}.png`));
  }
});
test("all unknown-price and unavailable cards use one manager message and never a preorder label",()=>{
  for(const price of [null,10000])for(const stock of [false,true]){
    const html=renderToStaticMarkup(<ProductCard slug="phone" name="Phone" minPrice={price} hasStock={stock} defaultVariantId="id"/>);
    assert(!html.includes('Под заказ'));assert(!html.includes('Уточняйте цену'));
    assert.equal((html.match(/Уточняйте у менеджера/g)??[]).length,price==null||!stock?1:0);
    const v=renderToStaticMarkup(<VariantCard slug="phone" variant={{id:"id",memory:"256GB",color:"Black",region:null,price,inStock:stock}}/>);
    assert.equal((v.match(/Уточняйте у менеджера/g)??[]).length,price==null||!stock?1:0);
    assert.equal(v.includes('В корзину'),price!=null&&stock);
  }
});
test("enrichment retains supplier offers, price/stock/IDs, regional offers and other storage configurations",()=>{
  const p=ANDROID_PHONE_CATALOG.find(p=>p.slug==='oneplus-15')!;
  const source=[{id:'paid',memory:'12/256GB',color:'Infinite Black',region:'CN',price:'62500',inStock:true,rawLabel:'supplier'}, {id:'other',memory:'24/1TB',color:'Infinite Black',region:'HK',price:99000,inStock:true}, {id:'empty',memory:null,color:null,region:null,price:null,inStock:false}];
  const before=structuredClone(source),plan=planPhoneEnrichment(source,p);
  assert.deepEqual(source,before);assert.deepEqual(plan.archive.map(v=>v.id),['empty']);
  assert(plan.updates.some(v=>v.id==='paid'&&v.region==='CN'));assert(plan.updates.some(v=>v.id==='other'&&v.memory==='24/1TB'));
  for(const v of plan.updates){assert(!('price' in v));assert(!('inStock' in v));assert(!('rawLabel' in v));}
  const after=[...plan.updates.map(v=>({...source.find(s=>s.id===v.id)!,...v})),...plan.create.map((v,i)=>({...v,id:'new'+i,price:null,inStock:false}))];
  const again=planPhoneEnrichment(after,p);assert.equal(again.create.length,0);assert.equal(again.archive.length,0);
  assert.equal(after.find(v=>v.id==='paid')!.price,'62500');assert.equal(after.find(v=>v.id==='other')!.price,99000);
});
test("incorrect unpriced placeholders can be archived, but unknown priced colors stop the update",()=>{
  const p=ANDROID_PHONE_CATALOG.find(p=>p.slug==='honor-600')!;
  const wrong={id:'placeholder',memory:null,color:'Sprout Green',region:null,price:null,inStock:false};
  assert.equal(planPhoneEnrichment([wrong],p).archive.length,1);
  assert.throws(()=>planPhoneEnrichment([{...wrong,price:50000}],p),/cannot identify color/);
  assert.throws(()=>planPhoneEnrichment([{...wrong,inStock:true}],p),/cannot identify color/);
  assert.deepEqual([...new Set(p.variants.map(v=>v.color))],['Orange','Black','Golden White']);
  assert(ANDROID_PHONE_CATALOG.find(p=>p.slug==='honor-600-lite')!.variants.some(v=>v.color==='Sprout Green'));
});

test("legacy importer enquiry placeholders do not block enrichment, but supplier edits remain protected",()=>{
  let checked=0;
  for(const p of products){
    const entry=OFFICIAL_CATALOG_ENTRIES.find(e=>e.slug===p.slug);if(!entry)continue;
    const old=officialVariants(entry).map((v,i)=>({...v,id:`${p.slug}-${i}`}));
    const before=structuredClone(old);
    const plan=planPhoneEnrichment(old,p);
    assert.equal(plan.updates.length+plan.archive.length,old.length,p.slug);
    assert.deepEqual(old,before);checked++;
    for(const archived of plan.archive){
      assert.throws(()=>planPhoneEnrichment([{...archived,price:12345}],p),/cannot identify color/);
      assert.throws(()=>planPhoneEnrichment([{...archived,rawLabel:'supplier revised',inStock:true}],p),/cannot identify color/);
    }
  }
  assert(checked>=23);
});
test("script is scoped and backs up before writing; no prices or stock are updated",async()=>{
  const source=await readFile(new URL('../scripts/sync-phone-enrichment.ts',import.meta.url),'utf8');
  assert(source.includes('if(dryRun)'));assert(source.indexOf('await writeFile(backup')<source.indexOf('await tx.product.update('));
  assert(source.includes('current.status!=="PUBLISHED"'));assert(!source.includes('.delete'));
  assert(source.includes('data:{memory:v.memory,color:v.color}'));
});
