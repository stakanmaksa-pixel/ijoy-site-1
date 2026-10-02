import { parsePriceListText, supplierIdentityKey } from "../../src/lib/priceImport";

export type ApprovedSupplierProduct = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  variants: Array<{
    memory: string | null;
    color: string | null;
    region: string | null;
    rawLabel: string;
  }>;
};

type ProductFamily = Omit<ApprovedSupplierProduct, "slug" | "variants"> & { region?: string | null };

const slugify = (name: string) => name.toLowerCase().replace(/\+/g, "-plus-")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function dysonEdition(label: string): string | null {
  const parts: string[] = [];
  if (/наша\s+вилка/iu.test(label)) parts.push("Наша вилка");
  if (/без\s+диффузора/iu.test(label)) parts.push("Без диффузора");
  else if (/\bwith\s+diffuse\b/i.test(label)) parts.push("С диффузором");
  if (/\+\s*док\s+станция/iu.test(label)) parts.push("С док-станцией");
  return parts.join(" · ") || null;
}

/** Only families explicitly approved by the owner, never a general auto-create rule. */
function approvedFamily(rawLabel: string): ProductFamily | null {
  const label = rawLabel.replace(/^\p{Regional_Indicator}{2}\s*/u, "")
    .replace(/^(?:Наушники|Колонка)\s+/iu, "").trim();
  if (/^Cirqa Black\s+(?:S-M|L-XL)\b/i.test(label)) {
    const fit = /\b(S-M|L-XL)\b/i.exec(label)?.[1]?.toUpperCase();
    return { name: "Garmin CIRQA Smart Band", brand: "Garmin", category: "fitnes-braslety", region: fit === "S-M" ? "S/M" : "L/XL" };
  }
  const series12 = /^Apple Watch S12 (42|46) (Space Gray|Black)\b.*\b(S\/M|M\/L)\b/i.exec(label);
  if (series12) {
    const band = series12[2].toLowerCase() === "black" ? "Black Sport Band" : "Navy Blue Sport Band";
    return { name: "Apple Watch Series 12", brand: "Apple", category: "chasy", region: band + " " + series12[3].toUpperCase() };
  }
  if (/^Plaud Note NB-100\b/i.test(label)) return { name: "Plaud Note NB-100", brand: "Plaud", category: "aksessuary" };
  if (/^Plaud Note Pro\b/i.test(label)) return { name: "Plaud Note Pro", brand: "Plaud", category: "aksessuary" };
  const fenix = /^(Fenix (?:9 Pro Solar|9 Pro|9|8 Pro|8))(?=\s|$)/i.exec(label);
  if (fenix) return { name: `Garmin ${fenix[1]}`, brand: "Garmin", category: "chasy", region: label.slice(fenix[1].length).trim() };
  if (/^Google Speaker\b/i.test(label)) return { name: "Google Speaker", brand: "Google", category: "portativnaya-akustika" };
  if (/^Google TV Streamer 4K\b/i.test(label)) return { name: "Google TV Streamer 4K", brand: "Google", category: "aksessuary" };
  const sonyCamera = /^Sony (A7 III|A7 IV|A7C)\b/i.exec(label);
  if (sonyCamera) return { name: `Sony ${sonyCamera[1]}`, brand: "Sony", category: "ekshn-kamery", region: /\bBody\b/i.test(label) ? "Body" : null };
  const sonyAudio = /^Sony (WF-1000\s*XM5|WH-1000\s*XM5SA|WH-1000\s*XM5|WH-1000\s*XM4|WH-ULT900N)\b/i.exec(label);
  if (sonyAudio) return { name: `Sony ${sonyAudio[1].replace(/\s+/g, "")}`, brand: "Sony", category: "naushniki", region: /мягкий\s+кейс/iu.test(label) ? "Мягкий кейс" : null };
  const jbl = /^JBL (Charge 6|Flip 6|Flip 7)\b/i.exec(label);
  if (jbl) return { name: `JBL ${jbl[1]}`, brand: "JBL", category: "portativnaya-akustika" };
  const harman = /^Harman Kardon (Aura Studio [45]|Onyx Studio 9)\b/i.exec(label);
  if (harman) return { name: `Harman Kardon ${harman[1]}`, brand: "Harman Kardon", category: "portativnaya-akustika" };
  const dji = /^DJI (Power 2000|MIC 3|MIC Mini|Osmo Action 5 Pro|Osmo Action 6|Osmo Mobile 7)(?!P\b)/i.exec(label);
  if (dji) return { name: `DJI ${dji[1]}`, brand: "DJI", category: /Power|MIC/i.test(dji[1]) ? "aksessuary" : "ekshn-kamery" };
  if (/^Insta\s*360 X6\b/i.test(label)) return { name: "Insta360 X6", brand: "Insta360", category: "ekshn-kamery" };
  if (/^GoPro HERO 11 Mini\b/i.test(label)) return { name: "GoPro HERO 11 Mini", brand: "GoPro", category: "ekshn-kamery" };
  if (/^Fujifilm Instax Mini Evo\b/i.test(label)) return { name: "Fujifilm Instax Mini Evo", brand: "Fujifilm", category: "ekshn-kamery" };
  const marshall = /^Marshall (Motif\s*(?:ll|II)\s*A\.?N\.?C\.?|Major IV|Kilburn (?:2|II)|Acton 3)(?=\s|$)/i.exec(label);
  if (marshall) {
    const model = marshall[1].replace(/^Motif\s*ll/i, "Motif II").replace(/^Kilburn (?:2|II)/i, "Kilburn II");
    return { name: `Marshall ${model}`, brand: "Marshall", category: /Motif|Major/i.test(model) ? "naushniki" : "portativnaya-akustika" };
  }
  const dyson = /^Dyson\s+(.+?)(?=\s*\(|\s*$)/i.exec(label);
  if (dyson) return {
    name: `Dyson ${dyson[1].trim()}`,
    brand: "Dyson",
    category: /\bCase\b/i.test(dyson[1]) ? "aksessuary" : "daisony",
    region: dysonEdition(label),
  };
  if (/^MacBook MGED4 Pro 16\b/i.test(label) && /\bM5 Max\b/i.test(label)) {
    return { name: "MacBook Pro 16-inch (M5)", brand: "Apple", category: "noutbuki", region: "M5 Max · 2026" };
  }
  return null;
}

function colorFromLabel(label: string, fallback: string | null): string | null {
  const parenthesized = /\(([^)]+)\)/u.exec(label)?.[1]?.trim();
  if (parenthesized && !/\b(?:наша\s+вилка|gen\s*\d+|\d+\s*шт|\d+\s*(?:GB|TB)|M5)\b/iu.test(parenthesized)) return parenthesized;
  if (/\bPitch Black\b/i.test(label)) return "Pitch Black";
  return fallback;
}

export function approvedSecondSupplierProducts(...texts: string[]): ApprovedSupplierProduct[] {
  const bySlug = new Map<string, ApprovedSupplierProduct>();
  const seen = new Set<string>();
  for (const text of texts) {
    for (const line of parsePriceListText(text)) {
      const rawLabel = line.parsedModel;
      if (!rawLabel) continue;
      const family = approvedFamily(rawLabel);
      if (!family) continue;
      const slug = family.name === "MacBook Pro 16-inch (M5)" ? "macbook-pro-16-m5" : slugify(family.name);
      const identity = supplierIdentityKey(rawLabel);
      if (!identity || seen.has(`${slug}|${identity}`)) continue;
      seen.add(`${slug}|${identity}`);
      const product = bySlug.get(slug) ?? {
        slug, name: family.name, brand: family.brand, category: family.category, variants: [],
      };
      const color = colorFromLabel(rawLabel, line.parsedColor);
      const memory = /^Plaud\b/i.test(family.name) ? "64GB"
        : family.name === "Apple Watch Series 12" ? line.parsedMemory
        : family.name === "MacBook Pro 16-inch (M5)" ? "36GB / " + line.parsedMemory + " SSD" : null;
      const googleColor = /^Google Speaker\b/i.test(family.name)
        ? rawLabel.replace(/^Google Speaker\s+/i, "").trim()
        : /^Google TV Streamer 4K\b/i.test(family.name)
          ? rawLabel.replace(/^Google TV Streamer 4K\s+/i, "").trim() : null;
      product.variants.push({ memory, color: googleColor || color, region: family.region ?? null, rawLabel });
      bySlug.set(slug, product);
    }
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "ru"));
}
