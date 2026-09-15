import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { IPHONE18_PRICES, planIphone18Prices } from "../data/iphone18-prices";
import { IPHONE_2026_CATALOG, iphone2026Variants } from "../data/iphone-2026-catalog";
import { VariantCard } from "../../src/components/VariantCard";
import { ProductOrder } from "../../src/components/ProductOrder";
import { iphone18Availability } from "../../src/lib/iphone18Availability";

test("owner's exact prices apply to both SIM types and every colour",()=>{
  assert.deepEqual(IPHONE18_PRICES["iphone-18-pro"],{"256GB":180000,"512GB":175000,"1TB":215000,"2TB":280000});
  assert.deepEqual(IPHONE18_PRICES["iphone-18-pro-max"],{"256GB":185000,"512GB":205000,"1TB":245000,"2TB":315000});
  for(const p of IPHONE_2026_CATALOG.slice(0,2)){
    const old=iphone2026Variants(p).map((v,i)=>({...v,id:String(i)}));
    const before=structuredClone(old);
    const plan=planIphone18Prices(p.slug,old);
    assert.equal(plan.updates.length,16);assert.equal(plan.creates.length,16);
    assert(plan.updates.every(v=>v.region==="eSIM"));
    assert(plan.creates.every(v=>v.region==="SIM+eSIM"&&!v.inStock));
    assert.deepEqual(old,before);
    const next=[...old.map(v=>({...v,...plan.updates.find(u=>u.id===v.id)})),...plan.creates.map((v,i)=>({...v,id:`new-${i}`}))];
    assert.equal(planIphone18Prices(p.slug,next).creates.length,0);
    for(const v of next) assert.equal(v.price,IPHONE18_PRICES[p.slug][v.memory]);
  }
});
test("ambiguous duplicates and unrelated models cannot be silently modified",()=>{
  assert.throws(()=>planIphone18Prices("iphone-duo",[]));
  const v={id:"a",memory:"256GB",color:"Black",region:null};
  assert.throws(()=>planIphone18Prices("iphone-18-pro",[v,{...v,id:"b"}]));
  assert.throws(()=>planIphone18Prices("iphone-18-pro",[{...v,region:"Japan"}]));
});
test("date appears with the real price on variant and full product, but not Duo",()=>{
  const variant={id:"v",memory:"256GB",color:"Black",region:"SIM+eSIM",price:180000,inStock:false};
  const html=renderToStaticMarkup(<VariantCard slug="iphone-18-pro" variant={variant}/>);
  assert(html.includes("В наличии с 23 сентября"));assert(html.includes("180"));assert(html.includes("SIM+eSIM"));
  const detail=renderToStaticMarkup(<ProductOrder productSlug="iphone-18-pro" productName="iPhone 18 Pro" variants={[variant]} allowUnavailableSelection/>);
  assert(detail.includes("В наличии с 23 сентября"));assert(!detail.includes("нет в наличии"));
  assert.equal(iphone18Availability("iphone-duo"),undefined);
});
