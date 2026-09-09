import {test} from "node:test";
import assert from "node:assert/strict";
import {renderToStaticMarkup} from "react-dom/server";
import {ProductCard} from "../../src/components/ProductCard";
import {VariantGrid} from "../../src/components/VariantGrid";
import {ProductDetail} from "../../src/components/ProductDetail";
import {CompareTable} from "../../src/components/CompareTable";
import {samsungMemoryColorGrid} from "../../src/lib/catalogPresentation";
import {colorToHex,colorLabel} from "../../src/lib/colorSwatch";
import {APPLE_KEYBOARD_CATALOG} from "../data/apple-keyboard-catalog";
import {SAMSUNG_TABLETS} from "../data/samsung-tablet-catalog";
import {GOOGLE_PIXEL_CATALOG} from "../data/google-pixel-catalog";

test("keyboard list renders every color with its own price, image and direct offer link",()=>{
  const cards=APPLE_KEYBOARD_CATALOG.flatMap(p=>p.variants.map(v=>{
    const id=`${p.slug}-${v.color}`;
    const html=renderToStaticMarkup(<ProductCard name={`${p.name} · ${v.color}`} slug={p.slug} minPrice={v.price} hasStock defaultVariantId={id} cardVariantId={id} exactPrice coverImage={v.image}/>);
    assert(html.includes(`?variant=${id}`));assert(html.includes(v.image));
    assert(!html.includes("от "));assert.equal((html.match(/<button/g)??[]).length,2);
    return html;
  }));
  assert.equal(cards.length,9);
});
test("Samsung grid renders only memory and color, not the internal regional offers",()=>{
  const variants=samsungMemoryColorGrid(["256GB","512GB"].flatMap(memory=>["Black","Silver"].flatMap(color=>["EU","HK"].map(region=>({id:memory+color+region,memory,color,region,price:70000,inStock:true}))))).variants;
  const html=renderToStaticMarkup(<VariantGrid slug="samsung-galaxy-s26-ultra" variants={variants} imageByVariant={{}}/>);
  assert(html.includes("Память"));assert(html.includes("Цвет"));
  assert(!html.includes("Регион"));assert.equal((html.match(/aria-label="Добавить в избранное"/g)??[]).length,4);
});
test("unpriced Samsung tablet still exposes configuration, gallery and compatibility details",()=>{
  const p=SAMSUNG_TABLETS[0];
  const variants=p.variants.map((v,i)=>({...v,id:`tab-${i}`,price:null,inStock:false}));
  const colorImages=Object.fromEntries(p.variants.map(v=>[v.color!,[v.image,...(v.images??[])]]));
  const html=renderToStaticMarkup(<ProductDetail productName={p.name} productSlug={p.slug} variants={variants} specs={p.specs} highlights={p.highlights} images={[p.variants[0].image]} colorImages={colorImages}/>);
  assert(html.includes("Уточняйте у менеджера"));assert(html.includes("S Pen"));assert(html.includes("дополнительное фото"));
  assert(!html.includes("Регион / SIM"));
});
test("new Pixel swatches are distinct, translated, and comparison accepts Samsung tablets",()=>{
  for(const color of new Set(GOOGLE_PIXEL_CATALOG.flatMap(p=>p.variants.map(v=>v.color!)))){
    assert.notEqual(colorToHex(color),"#c7c7cc",color);assert.notEqual(colorLabel(color),color);
  }
  const models=SAMSUNG_TABLETS.slice(0,2).map(p=>({...p,minPrice:null,hasStock:false,colors:p.variants.map(v=>v.color!),images:[p.variants[0].image],colorImages:null}));
  const html=renderToStaticMarkup(<CompareTable models={models}/>);
  assert(html.includes("Найти модель"));assert(html.includes("Samsung Galaxy Tab S11 Ultra"));assert(html.includes("MediaTek Dimensity 9400+"));
});
