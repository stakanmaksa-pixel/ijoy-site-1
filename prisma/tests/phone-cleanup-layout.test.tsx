import assert from "node:assert/strict";
import {test} from "node:test";
import {readFile} from "node:fs/promises";
import {renderToStaticMarkup} from "react-dom/server";
import {POCO_M8_CATALOG} from "../data/poco-m8-catalog";
import {OLD_SCREENSHOT_PHONES,shouldHideOldScreenshotPhone} from "../data/phone-cleanup-policy";
import {planPhoneEnrichment} from "../data/phone-enrichment-policy";
import {OFFICIAL_CATALOG_ENTRIES,officialVariants} from "../official-catalog";
import {catalogMenuLabel,catalogTitle} from "../../src/lib/catalogLabels";
import {catalogPhotoBounds} from "../../src/lib/catalogPhotos";
import {ProductCard} from "../../src/components/ProductCard";

test("M8 has all official RAM/color combinations and distinct whole-device photos",async()=>{
  assert.deepEqual(POCO_M8_CATALOG.map(p=>p.variants.length),[9,6]);
  for(const p of POCO_M8_CATALOG){
    const colors=new Map(p.variants.map(v=>[v.color,v.image]));assert.equal(colors.size,3);assert.equal(new Set(colors.values()).size,3);
    assert(Object.keys(p.specs).length>=15);assert(p.description.length>150);
    for(const src of new Set(p.variants.flatMap(v=>v.images??[v.image]))){await readFile(new URL('../../public'+src,import.meta.url));assert(catalogPhotoBounds(src));}
    const entry=OFFICIAL_CATALOG_ENTRIES.find(e=>e.slug===p.slug)!;
    const old=officialVariants(entry).map((v,i)=>({...v,id:String(i)}));
    const plan=planPhoneEnrichment(old,p);assert.equal(plan.create.length,p.variants.length);assert.equal(plan.archive.length,1);
    const again=planPhoneEnrichment(plan.create.map((v,i)=>({...v,id:String(i),price:null,inStock:false})),p);
    assert.equal(again.create.length,0);assert.equal(again.archive.length,0);
  }
});
test("hide policy is limited to seven screenshot models and does not hide newer families or accessories",()=>{
  assert.equal(OLD_SCREENSHOT_PHONES.length,7);
  for(const p of OLD_SCREENSHOT_PHONES){
    assert(shouldHideOldScreenshotPhone({...p,category:{slug:'telefony'}}));
    assert(!shouldHideOldScreenshotPhone({...p,category:{slug:'aksessuary'}}));
  }
  for(const slug of ['redmi-note-14-pro','redmi-note-15','redmi-17','xiaomi-17-ultra','poco-x8-pro','poco-m8-5g'])assert(!shouldHideOldScreenshotPhone({slug,name:slug,brand:slug.startsWith('poco')?'POCO':'Xiaomi',category:{slug:'telefony'}}));
});
test("menu labels remove only repeated ancestry, without losing REDMI identity or changing standalone names",()=>{
  for(const [parent,name,result] of [
    ['Apple iPhone','iPhone 17 Pro Max','17 Pro Max'],['Apple iPhone','Apple iPhone 17e','17e'],
    ['Samsung Galaxy','Samsung Galaxy S26 Ultra','S26 Ultra'],['Samsung Galaxy','Samsung Galaxy Z Fold8','Z Fold8'],
    ['Samsung Galaxy Watch','Samsung Galaxy Watch 9','9'],['Samsung Galaxy Tab','Samsung Galaxy Tab S11 Ultra','S11 Ultra'],
    ['Google Pixel','Google Pixel 10 Pro','10 Pro'],['HUAWEI','HUAWEI Pura 90s Pro','Pura 90s Pro'],
    ['POCO','POCO M8 Pro 5G','M8 Pro 5G'],['OnePlus','OnePlus 15','15'],
    ['Xiaomi и REDMI','Xiaomi 17T Pro','17T Pro'],['Xiaomi и REDMI','REDMI Note 15','REDMI Note 15'],
  ]){assert.equal(catalogMenuLabel(name,['Телефоны',parent]),result);assert.equal(catalogMenuLabel(name,[]),name);}
});
test("titles are complete, model numbers stay attached, and grids use available width",async()=>{
  assert.equal(catalogTitle('Redmi Note 15'),'Redmi Note\u00a015');
  assert.equal(catalogTitle('Magic Keyboard для iPad Pro 11 M5'),'Magic Keyboard для iPad Pro\u00a011 M5');
  const name='Samsung Galaxy S26 Ultra';
  const html=renderToStaticMarkup(<ProductCard name={name} slug="s26" minPrice={null} hasStock={false} defaultVariantId={null}/>);
  assert(html.includes(name));assert(!html.includes('line-clamp'));assert(!html.includes('truncate'));
  const css=await readFile(new URL('../../src/app/globals.css',import.meta.url),'utf8');
  assert(css.includes('repeat(auto-fill, minmax(min(100%, 240px), 1fr))'));
  for(const file of ['CatalogMenu.tsx','CatalogMenuDesktop.tsx']){
    const s=await readFile(new URL('../../src/components/'+file,import.meta.url),'utf8');assert(s.includes('catalogMenuLabel('));assert(s.includes('w-64'));
  }
  const source=await readFile(new URL('../scripts/sync-phone-catalog-cleanup.ts',import.meta.url),'utf8');
  assert(source.includes('if(dryRun)'));assert(!source.includes('.delete'));
  assert(source.indexOf('await writeFile(backup')<source.indexOf('data:{status:"HIDDEN"}'));
});
