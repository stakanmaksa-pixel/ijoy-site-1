// Разбор текстовых прайсов, присланных Telegram-ботом.
// Импорт остаётся предварительным: цены применяются только после проверки администратором.

export interface ParsedPriceLine {
  rawLine: string;
  parsedModel: string | null;
  parsedMemory: string | null;
  parsedColor: string | null;
  parsedRegion: string | null;
  parsedPrice: number | null;
  parsedSku: string | null;
  /** Internal parser metadata; persistence deliberately keeps the original supplier row. */
  phoneModel: string | null;
  nonActive: boolean;
}

type HeaderContext = { model: string | null; sim: string | null; country: string | null; nonActive: boolean };

const FLAG_RE = /\p{Regional_Indicator}{2}/u;
const CURRENCY_SUFFIX_RE = /(₽|руб(?:лей|ля)?\.?|р\.?)+$/i;
const COUNTRY_BY_FLAG: Record<string, string> = {
  "🇭🇰": "HK", "🇨🇳": "CN", "🇮🇳": "IN", "🇯🇵": "JP", "🇺🇸": "US",
  "🇨🇦": "CA", "🇰🇼": "KW", "🇰🇷": "KR", "🇸🇬": "SG", "🇧🇷": "BR",
  "🇦🇺": "AU", "🇦🇪": "AE", "🇪🇺": "EU", "🇹🇼": "TW", "🇲🇽": "MX",
  "🇸🇦": "SA", "🇶🇦": "QA", "🇴🇲": "OM", "🇧🇭": "BH", "🇲🇴": "MO",
};
const COUNTRY_ALIASES: Array<[RegExp, string]> = [
  [/\b(?:HK|HKG|NK|HONG\s*KONG)\b/i, "HK"],
  [/\b(?:CN|CHN|CHINA|MAINLAND\s+CHINA)\b/i, "CN"],
  [/\b(?:IN|IND|INDIA)\b/i, "IN"], [/\b(?:JP|JPN|JAPAN)\b/i, "JP"],
  [/\b(?:US|USA|UNITED\s+STATES)\b/i, "US"], [/\b(?:CA|CAN|CANADA)\b/i, "CA"],
  [/\b(?:KW|KWT|KUWAIT)\b/i, "KW"], [/\b(?:KR|KOR|KOREA|SOUTH\s+KOREA)\b/i, "KR"],
  [/\b(?:SG|SGP|SINGAPORE)\b/i, "SG"], [/\b(?:BR|BRA|BRAZIL)\b/i, "BR"],
  [/\b(?:AU|AUS|AUSTRALIA)\b/i, "AU"], [/\b(?:AE|UAE|EMIRATES)\b/i, "AE"],
  [/\b(?:EU|EUR|EUROPE)\b/i, "EU"], [/\b(?:TW|TWN|TAIWAN)\b/i, "TW"],
  [/\b(?:MX|MEX|MEXICO)\b/i, "MX"], [/\b(?:SA|SAU|SAUDI)\b/i, "SA"],
  [/\b(?:QA|QAT|QATAR)\b/i, "QA"], [/\b(?:OM|OMN|OMAN)\b/i, "OM"],
  [/\b(?:BH|BHR|BAHRAIN)\b/i, "BH"], [/\b(?:MO|MACAU|MACAO)\b/i, "MO"],
];
const COLOR_ALIASES: Array<[RegExp, string]> = [
  [/\b(?:gla?cier|glaicer)\b/i, "Glacier"], [/\b(?:blurgundy|burgundy)\b/i, "Burgundy"],
  [/\bjet\s+black\b/i, "Jet Black"], [/\bspace\s+gray\b/i, "Space Gray"],
  [/\brose\s+gold\b/i, "Rose Gold"],
  [/\bblack\b/i, "Black"], [/\bsilver\b/i, "Silver"], [/\bblue\b/i, "Blue"],
  [/\borange\b/i, "Orange"], [/\bwhite\b/i, "White"], [/\blavender\b/i, "Lavender"],
  [/\bsage\b/i, "Sage"], [/\bgreen\b/i, "Green"], [/\bpink\b/i, "Pink"],
  [/\bmidnight\b/i, "Midnight"], [/\bstarlight\b/i, "Starlight"],
  [/\bpurple\b/i, "Purple"], [/\byellow\b/i, "Yellow"], [/\bteal\b/i, "Teal"],
  [/\bultramarine\b/i, "Ultramarine"], [/\bnatural\b/i, "Natural"],
  [/\bdesert\b/i, "Desert"], [/\bgold\b/i, "Gold"], [/\bred\b/i, "Red"],
  [/\b(?:night\s+sky)\b/i, "Night Sky"], [/\bstar\s+white\b/i, "Star White"],
];

const IGNORE_PRICE_LINE_RE = /\b(?:gadgess?|corning\s+glass|demo|mac\s+studio|garmin\s+venu\s+x1|yandex\s+alice\s+duo\s+max)\b|яндекс\s+алиса\s+дуо\s+макс|\bapple\s+watch\s+(?:se\s*2|s10|series\s*10|ultra\s*2)\b|(?:^|[^\p{L}])(?:актив|демо|перепрош\p{L}*)(?=$|[^\p{L}])/iu;
const NON_ACTIVE_RE = /(?:^|[^\p{L}])неактив(?=$|[^\p{L}])/iu;

function stripMarkup(value: string) {
  return value.replace(/\*\*/g, "").replace(/^[\s#*_–—-]+|[\s*_]+$/g, "").trim();
}

function normalizePriceToken(rawToken: string): number | null {
  let token = rawToken.replace(CURRENCY_SUFFIX_RE, "").replace(/[\s\u00a0]/g, "").trim();
  if (!token) return null;

  // В российских прайсах точка/запятая между трёхзначными группами — разделитель тысяч.
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(token)) token = token.replace(/[.,]/g, "");
  else if (token.includes(",") && !token.includes(".")) {
    const parts = token.split(",");
    token = parts.length === 2 && parts[1].length <= 2 ? parts.join(".") : token.replace(/,/g, "");
  } else if (token.includes(",") && token.includes(".")) token = token.replace(/,/g, "");

  if (!/^\d+(?:\.\d+)?$/.test(token)) return null;
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

function findPrice(text: string): { value: number | null; start: number | null } {
  const searchable = text.replace(/\([^)]*(?:актив|неактив|предактив|запак|запечатан|распакован)[^)]*\)/gi, " ").replace(/🏎️?/gu, " ");
  const patterns = [
    /(?:[-–—]\s*)?(\d[\d.,\s\u00a0]*?)\s*(?:₽|руб(?:лей|ля)?\.?|р\.?)\s*$/iu,
    /[-–—]\s*(\d[\d.,\s\u00a0]*)\s*$/u,
    /\s(\d{4,})\s*$/u,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(searchable);
    if (!match) continue;
    const value = normalizePriceToken(match[1]);
    if (value !== null) return { value, start: text.lastIndexOf(match[1]) };
  }
  return { value: null, start: null };
}

function modelName(text: string): string | null {
  const cleaned = text.replace(/^\p{Regional_Indicator}{2}\s*/u, "").replace(/^[📱📲]\s*/u, "");
  if (/\biphone\s+air\b/i.test(cleaned)) return "iPhone Air";
  const match = /\b(?:iphone\s*)?(13|14|15|16|17|18)\s*(pro\s*max|pro|max|plus|mini|air|e)?\b/i.exec(cleaned);
  if (!match) return null;
  const suffix = (match[2] ?? "").replace(/\s+/g, " ").toLowerCase();
  const titleSuffix = suffix === "pro max" || suffix === "max" ? "Pro Max"
    : suffix === "pro" ? "Pro" : suffix ? suffix[0].toUpperCase() + suffix.slice(1) : "";
  return `iPhone ${match[1]}${titleSuffix ? ` ${titleSuffix}` : ""}`;
}

function memory(text: string): string | null {
  if (/\bapple\s+watch\b/i.test(text)) {
    const watchCase = /\b(40|41|42|44|45|46|49)\s*(?:mm|мм)?\b/i.exec(text);
    if (watchCase) return `${watchCase[1]} мм`;
  }
  const explicit = /\b(64|128|256|512|1024|1|2|4)\s*(GB|ГБ|TB|ТБ)\b/i.exec(text);
  if (explicit) {
    const amount = explicit[1] === "1024" ? "1" : explicit[1];
    const unit = explicit[2].toUpperCase().startsWith("T") ? "TB" : "GB";
    return `${amount}${unit}`;
  }
  const bare = /\b(64|128|256|512|1024|1|2|4)\b(?=\s+(?:black|silver|blue|orange|white|glacier|glaicer|burgundy|blurgundy|lavender|sage|green|pink|midnight|starlight|purple|yellow|teal|ultramarine|natural|desert|gold|red)\b)/i.exec(text);
  if (!bare) return null;
  return `${bare[1] === "1024" ? "1" : bare[1]}${Number(bare[1]) >= 1024 || Number(bare[1]) <= 4 ? "TB" : "GB"}`;
}

function watchStrapSize(text: string): string | null {
  if (!/\bapple\s+watch\b/i.test(text)) return null;
  return /(?:^|\s)(XS\/S|S\/M|M\/L|S|M|L)(?=\s|$)/i.exec(text)?.[1].toUpperCase() ?? null;
}

function countryCode(text: string): string | null {
  const flag = FLAG_RE.exec(text)?.[0];
  if (flag && COUNTRY_BY_FLAG[flag]) return COUNTRY_BY_FLAG[flag];
  for (const [pattern, code] of COUNTRY_ALIASES) if (pattern.test(text)) return code;
  return null;
}

export function canonicalIphoneModel(text: string): string | null {
  return modelName(text);
}

function explicitSim(text: string): string | null {
  if (/\b(?:2\s*(?:physical\s*)?sim|dual\s*nano[- ]?sim|2\s*nano)/i.test(text)) return "2 SIM";
  if (/\b(?:1\s*sim\s*\+\s*e\s*sim|nano[- ]?sim\s*\+\s*e\s*sim|sim\s*\+\s*e\s*sim)/i.test(text)) return "SIM+eSIM";
  if (/\besim\b/i.test(text)) return "eSIM";
  return null;
}

/** Known Apple hardware defaults are keyed by generation + sales region, never country alone. */
export function inferIphoneSim(model: string | null, country: string | null): string | null {
  if (!model || !country) return null;
  const generation = Number(/iPhone\s+(\d+)/i.exec(model)?.[1]);
  if (!generation) return null;

  if (country === "CN") {
    if (generation === 13 && /\bmini\b/i.test(model)) return null;
    if ((generation === 16 && /\be\b/i.test(model)) || (generation === 17 && /\be\b/i.test(model))) return null;
    return generation >= 13 && generation <= 17 ? "2 SIM" : null;
  }
  if (country === "HK" || country === "MO") {
    if (generation === 17 || generation === 18) return "SIM+eSIM";
    if (generation >= 13 && generation <= 16) {
      return /\bmini\b|\be\b/i.test(model) ? "SIM+eSIM" : "2 SIM";
    }
  }
  const esimOnly17Markets = new Set(["US", "CA", "MX", "JP", "AE", "SA", "BH", "KW", "QA", "OM"]);
  if (generation === 17 && esimOnly17Markets.has(country)) return "eSIM";
  if (country === "US" && generation >= 14 && generation <= 16) return "eSIM";
  if (generation >= 13 && generation <= 17) return "SIM+eSIM";
  return null;
}

export function normalizedIphoneRegion(text: string | null, model: string | null): string | null {
  if (!text) return null;
  const country = countryCode(text);
  const sim = explicitSim(text) ?? inferIphoneSim(model, country);
  return [country, sim].filter(Boolean).join(" · ") || null;
}

/**
 * The storefront usually distinguishes iPhone variants by SIM configuration,
 * while supplier rows may additionally include a country code. Keep country
 * for SIM inference, but match the variant on the SIM configuration itself.
 */
export function normalizedIphoneSim(text: string | null, model: string | null): string | null {
  if (!text) return null;
  return explicitSim(text) ?? inferIphoneSim(model, countryCode(text));
}

function parsedFields(rawLine: string, inherited: HeaderContext = { model: null, sim: null, country: null, nonActive: false }): ParsedPriceLine {
  const raw = stripMarkup(rawLine);
  const { value: parsedPrice, start } = findPrice(raw);
  const parsedModel = start === null ? raw || null : raw.slice(0, start).replace(/[-–—\s]+$/u, "").trim() || null;
  const source = parsedModel ?? raw;
  const parsedProduct = modelName(source) ?? inherited.model;
  const parsedMemory = memory(source);
  const parsedColor = COLOR_ALIASES.find(([pattern]) => pattern.test(source))?.[1] ?? null;
  // Apple part numbers (e.g. MW493, MEQU4) are more reliable than a free-form
  // title for accessories and watch variants. Avoid short family tokens such
  // as S10/M4 and capacity/year numbers.
  const parsedSku = source.match(/\b(?=[A-Z0-9]{4,12}\b)(?=[A-Z0-9]*[A-Z])(?=[A-Z0-9]*\d)[A-Z0-9]+\b/g)?.at(-1) ?? null;
  const country = countryCode(source) ?? inherited.country;
  const sim = explicitSim(source) ?? inherited.sim ?? inferIphoneSim(parsedProduct, country);
  const parsedRegion = /\bapple\s+watch\b/i.test(source)
    ? watchStrapSize(source)
    : [country, sim].filter(Boolean).join(" · ") || null;

  return {
    rawLine: raw, parsedModel, parsedMemory, parsedColor, parsedRegion, parsedPrice, parsedSku,
    phoneModel: parsedProduct,
    nonActive: NON_ACTIVE_RE.test(raw) || inherited.nonActive,
  };
}

/** Prefer non-active rows for the same site variant, independent of supplier country. */
export function inactivePreferenceKey(line: ParsedPriceLine): string | null {
  if (!line.parsedMemory || !line.parsedColor || !line.parsedRegion) return null;
  const model = line.phoneModel ?? modelName(line.parsedModel ?? "");
  if (!model) return null;
  const sim = normalizedIphoneSim(line.parsedRegion, model) ?? line.parsedRegion;
  return [model, line.parsedMemory, line.parsedColor, sim].map((part) => part.toLowerCase()).join("|");
}

export function parsePriceLine(line: string): ParsedPriceLine {
  return parsedFields(line);
}

export function parsePriceListText(text: string): ParsedPriceLine[] {
  const result: ParsedPriceLine[] = [];
  let header: HeaderContext = { model: null, sim: null, country: null, nonActive: false };
  for (const original of text.split(/\r?\n/u)) {
    const line = stripMarkup(original);
    if (!line) continue;
    // These are not storefront offers per the supplier's rules: active/demo/
    // reflashed units and Gadgess glass are handled separately.
    if (IGNORE_PRICE_LINE_RE.test(line)) continue;
    const parsed = parsedFields(line, header);
    if (parsed.parsedPrice === null) {
      const model = modelName(line);
      if (parsed.parsedMemory && parsed.parsedColor && (parsed.phoneModel || header.model)) result.push(parsed);
      if (model) {
        header = {
          model,
          sim: explicitSim(line),
          country: countryCode(line),
          nonActive: /\bнеактив\b/i.test(line),
        };
      }
      continue;
    }
    result.push(parsed);
  }
  return result;
}

/** Normalization used when comparing supplier rows with existing raw labels. */
export function normalizeForMatch(text: string): string {
  return text.toLowerCase()
    .replace(/glacier|glaicer/gu, "glacier")
    .replace(/blurgundy/gu, "burgundy")
    .replace(/\b(?:1\s*tb|1024\s*gb)\b/gu, "1tb")
    .replace(/\b(\d+)\s*(?:gb|гб)\b/gu, "$1gb")
    .replace(/\b(\d+)\s*(?:tb|тб)\b/gu, "$1tb")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim().replace(/\s+/g, " ");
}
