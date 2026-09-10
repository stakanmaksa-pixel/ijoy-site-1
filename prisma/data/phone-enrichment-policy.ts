import type { RefreshProduct } from "./catalog-refresh-types";
import { planRefreshVariants } from "./catalog-refresh-policy";
import { variantImageKey } from "../../src/lib/pickCoverImage";
import { OFFICIAL_CATALOG_ENTRIES, officialVariants } from "../official-catalog";

export type ExistingPhoneOffer = {
  id: string; memory: string | null; color: string | null; region: string | null;
  price: unknown; inStock: boolean; rawLabel?: string | null;
};
// Equivalent manufacturer names, not guesses between different physical colors.
const COLOR_ALIASES: Record<string, Record<string, string>> = {
  "huawei-mate-x7": {"Universe Red":"Nebula Red", "Obsidian Black":"Black"},
};

export function planPhoneEnrichment<T extends ExistingPhoneOffer>(existing: T[], product: RefreshProduct) {
  const galleries: Record<string,string[]> = {};
  for(const v of product.variants) if(v.color) galleries[v.color]=[...new Set([v.image,...(v.images??[])])];
  const canonicalColor = (color: string | null) => {
    if(!color)return null;
    const alias=COLOR_ALIASES[product.slug]?.[color]??color;
    return Object.keys(galleries).find(c=>c.toLowerCase().replace(/grey/g,"gray")===alias.toLowerCase().replace(/grey/g,"gray"))??null;
  };
  const retained=existing.filter(v=>canonicalColor(v.color)&&v.memory);
  const archive=existing.filter(v=>!retained.includes(v));
  // The old official importer set inStock=true even on empty enquiry-only
  // placeholders. Identify those by their EXACT generated axes and raw label,
  // not by a loose name/prefix. A priced or supplier-edited offer stays protected.
  const legacyEntry=OFFICIAL_CATALOG_ENTRIES.find(p=>p.slug===product.slug);
  const legacy=legacyEntry?officialVariants(legacyEntry):[];
  const isLegacyPlaceholder=(v:T)=>v.price==null&&legacy.some(old=>
    old.memory===v.memory&&old.color===v.color&&old.region===v.region&&old.rawLabel===v.rawLabel);
  // An unexpected real supplier offer must be reviewed, never silently hidden.
  const protectedOffers=archive.filter(v=>v.price!=null||(v.inStock&&!isLegacyPlaceholder(v)));
  if(protectedOffers.length)throw new Error(`${product.slug}: cannot identify color/memory of priced or stocked offers: ${protectedOffers.map(v=>`${v.id} (${v.memory??"—"}, ${v.color??"—"})`).join(", ")}. No database changes applied. Review these offers before retrying.`);
  const normalized=retained.map(v=>({...v,color:canonicalColor(v.color)!}));
  const plan=planRefreshVariants(normalized,product);
  // Unlike a full range refresh, keep regional/storage configurations already
  // present in the supplier catalogue when their physical color is recognized.
  const updates=plan.options.flatMap(({existing:v,option})=>v?[{id:v.id,memory:option.memory,color:option.color,region:v.region}]:[]);
  updates.push(...plan.remaining.map(v=>({id:v.id,memory:v.memory,color:v.color,region:v.region})));
  for(const v of [...product.variants,...updates])if(v.color)galleries[variantImageKey(v)]=galleries[v.color];
  return {archive,updates,create:plan.options.filter(v=>!v.existing).map(v=>v.option),colorImages:galleries,images:[...new Set(product.variants.flatMap(v=>[v.image,...(v.images??[])]))]};
}
