// Owner's price list, September 2026. 18 Pro 512GB is intentionally cheaper than 256GB.
export const IPHONE18_PRICES: Record<string, Record<string, number>> = {
  "iphone-18-pro": { "256GB": 180000, "512GB": 175000, "1TB": 215000, "2TB": 280000 },
  "iphone-18-pro-max": { "256GB": 185000, "512GB": 205000, "1TB": 245000, "2TB": 315000 },
};
const colors = ["Black", "Silver", "Glacier", "Burgundy"];
type Offer = { id: string; memory: string | null; color: string | null; region: string | null };
const normalize = (s: string | null) => (s ?? "").replace(/\s/g, "").replace(/гб/gi,"GB").replace(/тб/gi,"TB").toLowerCase();
export function planIphone18Prices(slug: string, existing: Offer[]) {
  const prices = IPHONE18_PRICES[slug];
  if (!prices) throw Error(`Unsupported product: ${slug}`);
  for (const v of existing) {
    if (!Object.keys(prices).some(m=>normalize(m)===normalize(v.memory)) || !colors.some(c=>normalize(c)===normalize(v.color)) || !["", "esim", "sim+esim"].includes(normalize(v.region))) throw Error(`Неизвестная модификация ${v.id}; требуется проверка.`);
  }
  const updates: {id:string; region:string; price:number}[] = [];
  const creates: {memory:string; color:string; region:string; price:number; inStock:boolean}[] = [];
  for (const [memory,price] of Object.entries(prices)) for (const color of colors) {
    const bucket = existing.filter(v=>normalize(v.memory)===normalize(memory) && normalize(v.color)===normalize(color));
    const unspecified = bucket.filter(v=>!v.region?.trim());
    const esim = bucket.filter(v=>normalize(v.region)==="esim");
    const sim = bucket.filter(v=>normalize(v.region)==="sim+esim");
    if (unspecified.length + esim.length > 1 || sim.length > 1) throw Error(`Дубли ${slug} ${memory} ${color}; база не изменена.`);
    for (const [region, old] of [["eSIM", esim[0] ?? unspecified[0]], ["SIM+eSIM", sim[0]]] as const) {
      if (old) updates.push({id:old.id,region,price});
      else creates.push({memory,color,region,price,inStock:false});
    }
  }
  return {updates,creates};
}
