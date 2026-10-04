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
  "🇵🇦": "PA", "🇨🇱": "CL", "🇰🇿": "KZ", "🇿🇦": "ZA", "🇷🇺": "RU",
  "🇲🇾": "MY", "🇮🇩": "ID", "🇹🇭": "TH",
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
  [/\bPA\b/i, "PA"], [/\bCL\b/i, "CL"], [/\bKZ\b/i, "KZ"],
  [/\bZA\b/i, "ZA"], [/\bRU\b/i, "RU"], [/\bMY\b/i, "MY"],
  [/\bID\b/i, "ID"], [/\bTH\b/i, "TH"],
];
const COLOR_ALIASES: Array<[RegExp, string]> = [
  [/\btitanium\s+whitesilver\b/i, "Titanium Whitesilver"],
  [/\btitanium\s+silverblue\b/i, "Titanium Silverblue"],
  [/\btitanium\s+black\b/i, "Titanium Black"],
  [/\btitanium\s+gr[ae]y\b/i, "Titanium Gray"],
  [/\bcobalt\s+violet\b/i, "Cobalt Violet"], [/\bsilver\s+shadow\b/i, "Silver Shadow"],
  [/\b(?:sky\s+blue|skyblue)\b/i, "Sky Blue"], [/\bblue\s+shadow\b/i, "Blue Shadow"],
  [/\b(?:icy\s*blue|ice\s*blue)\b/i, "Icy Blue"],
  [/\b(?:jet\s*black|jetblack)\b/i, "Jet Black"],
  [/\b(?:graphite|graphitte)\b/i, "Graphite"],
  [/\bspace\s+gray\b/i, "Space Gray"], [/\bspace\s+black\b/i, "Space Black"],
  [/\bblueberry\b/i, "Blueberry"], [/\bpistachio\b/i, "Pistachio"],
  [/\bnavy\b/i, "Navy"], [/\bmint\b/i, "Mint"],
  [/\bmauve\b/i, "Mauve"], [/\bgr[ae]y\b/i, "Gray"],
  [/\b(?:gla?cier|glaicer)\b/i, "Glacier"], [/\b(?:blurgundy|burgundy)\b/i, "Burgundy"],
  [/\brose\s+gold\b/i, "Rose Gold"], [/\bbronze\b/i, "Bronze"],
  [/\bblack\b/i, "Black"], [/\bsilver\b/i, "Silver"], [/\bblue\b/i, "Blue"],
  [/\borange\b/i, "Orange"], [/\bwhite\b/i, "White"], [/\blavender\b/i, "Lavender"],
  [/\bsage\b/i, "Sage"], [/\bgreen\b/i, "Green"], [/\bpink\b/i, "Pink"],
  [/\bmidnight\b/i, "Midnight"], [/\bstarlight\b/i, "Starlight"],
  [/\bcitrus\b/i, "Citrus"], [/\bblush\b/i, "Blush"],
  [/\bpurple\b/i, "Purple"], [/\byellow\b/i, "Yellow"], [/\bteal\b/i, "Teal"],
  [/\bultramarine\b/i, "Ultramarine"], [/\bnatural\b/i, "Natural"],
  [/\bdesert\b/i, "Desert"], [/\bgold\b/i, "Gold"], [/\bred\b/i, "Red"],
  [/\b(?:night\s+sky)\b/i, "Night Sky"], [/\bstar\s+white\b/i, "Star White"],
  [/(?:^|[^\p{L}])черн(?:ый|ая)(?=$|[^\p{L}])/iu, "Black"],
  [/(?:^|[^\p{L}])бел(?:ый|ая)(?=$|[^\p{L}])/iu, "White"],
  [/(?:^|[^\p{L}])голуб(?:ой|ая)(?=$|[^\p{L}])/iu, "Sky Blue"],
  [/(?:^|[^\p{L}])фиолетов(?:ый|ая)(?=$|[^\p{L}])/iu, "Cobalt Violet"],
];

const IGNORE_PRICE_LINE_RE = /\b(?:gadgess?|corning\s+glass)\b|\bapple\s+watch\s+(?:se\s*2|ultra\s*2)\b|(?:^|[^\p{L}])(?:предактив|актив|демо|перепрош\p{L}*|мят\p{L}*|порван\p{L}*|поврежд\p{L}*|сломан\p{L}*)(?=$|[^\p{L}])/iu;
const BULK_PRICE_LINE_RE = /^(?:от\s*\d+\s*шт\b|микс\s+от\s*\d+\s*шт\b)/iu;
const NON_ACTIVE_RE = /(?:^|[^\p{L}])неактив(?=$|[^\p{L}])/iu;
const CONDITION_NOTE_RE = /\([^)]*(?:актив|неактив|предактив|демо|перепрош|запечатан|распакован|мят|порван|ушк|коробк)[^)]*\)/giu;
const APPLE_PART_NUMBER_RE = /\b(?:M[A-Z0-9]{4,5}|Z1[A-Z0-9]{6,10})\b/g;

function hasApplePartNumber(text: string): boolean {
  return /\b(?:apple|ipad|macbook|airpods)\b/i.test(text);
}

function stripMarkup(value: string) {
  return value.replace(/\*/g, "").replace(/^[\s#_–—-]+|[\s_]+$/g, "").trim();
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
  const searchable = text
    .replace(/\([^)]*(?:актив|неактив|предактив|запак|запечатан|распакован|\d+\s*шт)[^)]*\)/giu, " ")
    .replace(/[🏎🚚🔥]\uFE0F?/gu, " ").trim();
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
  // A bare generation is valid only at the beginning of a phone offer. A
  // MacBook Air 13 or iPad Air 13 is not an iPhone 13.
  const match = /\biphone\s*(13|14|15|16|17|18)\s*(pro\s*max|pro|max|plus|mini|air|e)?\b/i.exec(cleaned)
    ?? /^(13|14|15|16|17|18)\s*(pro\s*max|pro|max|plus|mini|air|e)?\b/i.exec(cleaned);
  if (!match) return null;
  const suffix = (match[2] ?? "").replace(/\s+/g, " ").toLowerCase();
  if (match[1] === "17" && suffix === "air") return "iPhone Air";
  const titleSuffix = suffix === "pro max" || suffix === "max" ? "Pro Max"
    : suffix === "pro" ? "Pro" : suffix ? suffix[0].toUpperCase() + suffix.slice(1) : "";
  return `iPhone ${match[1]}${titleSuffix ? ` ${titleSuffix}` : ""}`;
}

function memory(text: string): string | null {
  if (/\bapple\s+watch\b/i.test(text)) {
    const watchCase = /\b(40|41|42|44|45|46|49)\s*(?:mm|мм)?\b/i.exec(text);
    if (watchCase) return `${watchCase[1]} мм`;
  }
  // MacBooks list RAM before SSD capacity: (M5, 16GB, 512GB).
  const macStorage = /\bmacbook\b/i.test(text)
    ? [...text.matchAll(/\b(64|128|256|512|1024|1|2|4)\s*(GB|ГБ|TB|ТБ)\b/gi)].at(-1) ?? null
    : null;
  const explicit = macStorage ?? /\b(64|128|256|512|1024|1|2|4)\s*(GB|ГБ|TB|ТБ)\b/i.exec(text);
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
  return /(?:^|\s)(XS\/S|S\/M|M\/L|S|M|L)(?=\s|$)/i.exec(text)?.[1].toUpperCase() ?? null;
}

function supplierWatchCaseColor(text: string): string | null {
  const match = /\bapple\s+watch\s+(?:(?:series\s*|s\s*)\d+|se\s*\d+|ultra\s*\d+)\s+(?:40|41|42|44|45|46|49)\s*(?:mm|мм)?\s+(jet\s+black|space\s+gray|rose\s+gold|natural|silver|black|starlight|midnight|white|gold|bronze)\b/i.exec(text);
  if (!match) return null;
  const value = match[1].toLowerCase().replace(/\s+/g, " ");
  return ({ "jet black": "Jet Black", "space gray": "Space Gray", "rose gold": "Rose Gold" } as Record<string, string>)[value]
    ?? value[0].toUpperCase() + value.slice(1);
}

/** Canonical family name used to compare watch supplier rows with catalog products. */
export function appleWatchModel(text: string | null): string | null {
  if (!text) return null;
  const match = /\bapple\s+watch\s+(?:(?:series\s*|s\s*)(\d+)|se\s*(\d+)|ultra\s*(\d+))/i.exec(text);
  if (!match) return null;
  if (match[1]) return `Apple Watch Series ${match[1]}`;
  if (match[2]) return `Apple Watch SE ${match[2]}`;
  return `Apple Watch Ultra ${match[3]}`;
}

function appleWatchCaseSize(text: string | null): string | null {
  if (!text) return null;
  const size = /\b(40|41|42|44|45|46|49)\s*(?:mm|мм)?\b/i.exec(text)?.[1];
  return size ?? null;
}

function appleWatchCaseColor(text: string | null): string | null {
  if (!text) return null;
  return normalizeForMatch(text.replace(/\b(?:titanium|aluminum|aluminium|case)\b/gi, " ")) || null;
}

function appleWatchBandMatches(source: string, target: string): boolean {
  const sourceText = normalizeForMatch(source);
  const targetText = normalizeForMatch(target);
  const bandFamilies = ["ocean band", "milanese loop", "alpine loop", "trail loop", "sport band"];
  const explicitFamily = bandFamilies.find((family) => sourceText.includes(family));
  if (explicitFamily && !targetText.includes(explicitFamily)) return false;
  if (!explicitFamily && /\bloop\b/.test(sourceText) && !/\bloop\b/.test(targetText)) return false;
  if (/\bdenim\b/.test(sourceText) && !/\bdenim\b/.test(targetText)) return false;

  const sourceBandShades = sourceText.match(/\btranslucent\s+[a-z]+\b/g) ?? [];
  if (sourceBandShades.some((shade) => !targetText.includes(shade))) return false;
  return true;
}

export type SupplierVariantCandidate = {
  id: string;
  productName: string;
  memory: string | null;
  color: string | null;
  region: string | null;
  rawLabel: string | null;
};

/**
 * Match Apple Watch rows only when model, case size and case color identify a
 * single catalog option. Any strap details present in the supplier row must
 * also agree; an ambiguous or incomplete configuration is deliberately left
 * for review instead of assigning the wrong price.
 */
export function matchAppleWatchVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  if (!/\bapple\s+watch\b/i.test(line.parsedModel ?? "")) return null;
  const model = appleWatchModel(line.parsedModel);
  const caseSize = appleWatchCaseSize(line.parsedMemory) ?? appleWatchCaseSize(line.parsedModel);
  const sourceColor = appleWatchCaseColor(line.parsedColor);
  if (!model || !caseSize || !sourceColor) return null;

  const matches = candidates.filter((candidate) => {
    const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
    const candidateModel = appleWatchModel(candidate.productName) ?? appleWatchModel(candidate.rawLabel);
    if (candidateModel !== model) return false;

    const candidateCaseSize = appleWatchCaseSize(candidate.memory) ?? appleWatchCaseSize(stored?.parsedMemory ?? null);
    if (candidateCaseSize !== caseSize) return false;

    const candidateColors = [candidate.color, stored?.parsedColor]
      .map((value) => appleWatchCaseColor(value ?? null))
      .filter((value): value is string => Boolean(value));
    if (!candidateColors.includes(sourceColor)) return false;

    const candidateBandText = [candidate.region, candidate.rawLabel].filter(Boolean).join(" ");
    const sourceFit = watchStrapSize(line.parsedModel ?? "");
    const candidateFit = watchStrapSize(candidateBandText);
    if (sourceFit && candidateFit !== sourceFit) return false;
    if (!appleWatchBandMatches(line.parsedModel ?? "", candidateBandText)) return false;
    return true;
  });

  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

/** Match the original AirPods Max generations only when the edition is recorded. */
export function matchAirPodsMaxVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  const source = line.parsedModel ?? "";
  if (!/\bairpods\s+max\b/i.test(source) || /\bairpods\s+max\s*2\b/i.test(source)) return null;
  const year = /\b(2020|2024)\b/.exec(source)?.[1] ?? null;
  const connector = /\busb\s*[-‐‑]?\s*c\b/i.test(source) ? "usb c"
    : /\blightning\b/i.test(source) ? "lightning" : null;
  const sourceColor = appleWatchCaseColor(line.parsedColor);
  if ((!year && !connector) || !sourceColor) return null;

  const matches = candidates.filter((candidate) => {
    if (!/^airpods\s+max$/i.test(normalizeForMatch(candidate.productName))) return false;
    const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
    const candidateColors = [candidate.color, stored?.parsedColor]
      .map((value) => appleWatchCaseColor(value ?? null))
      .filter((value): value is string => Boolean(value));
    if (!candidateColors.includes(sourceColor)) return false;

    const edition = normalizeForMatch([candidate.region, candidate.rawLabel].filter(Boolean).join(" "));
    const hasYear = Boolean(year && edition.includes(year));
    const hasConnector = Boolean(connector && edition.includes(connector));
    return hasYear || hasConnector;
  });

  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

function samsungModel(text: string | null): string | null {
  if (!text) return null;
  const name = text.replace(/^samsung\s+galaxy\s+/i, "").replace(/^galaxy\s+/i, "");
  const match = /^(S(?:25|26)(?:\s*FE(?:\s*5G)?|\s*Ultra|\+)?|Z\s*Fold\s*7)(?=\s|$)/i.exec(name);
  if (!match) return null;
  return match[1].toLowerCase().replace(/\s+/g, "").replace(/fe(?:5g)?$/, "fe5g");
}

function storageKey(text: string | null): string | null {
  const match = text?.match(/\b(\d+)\s*(GB|ГБ|TB|ТБ)\b/gi)?.at(-1);
  return match ? normalizedMemory(match) : normalizedMemory(text);
}

function samsungColorKey(text: string | null): string | null {
  if (!text) return null;
  return normalizeForMatch(text)
    .replace(/\bjetblack\b/g, "jet black")
    .replace(/\bicyblue\b|\biceblue\b/g, "icy blue")
    .replace(/\bgraphitte\b/g, "graphite")
    .replace(/\blight blue\b/g, "sky blue")
    .replace(/^violet$/, "cobalt violet");
}

/** Samsung model, RAM/storage, finish and (when stored) market must agree. */
export function matchSamsungVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  const model = samsungModel(line.parsedModel);
  const color = samsungColorKey(line.parsedColor);
  const storage = storageKey(line.parsedMemory);
  if (!model || !color || !storage) return null;
  const source = line.parsedModel ?? "";
  const ram = /\b(\d+)\s*\/\s*\d+\s*(?:GB|ГБ|TB|ТБ)\b/i.exec(source)?.[1] ?? null;
  const country = countryCode(source);

  const matches = candidates.filter((candidate) => {
    if (samsungModel(candidate.productName) !== model) return false;
    const stored = candidate.rawLabel ? parsePriceLine(candidate.rawLabel) : null;
    if (storageKey(candidate.memory ?? stored?.parsedMemory ?? null) !== storage) return false;
    const candidateRam = /\b(\d+)\s*\/\s*\d+\s*(?:GB|ГБ|TB|ТБ)\b/i.exec(candidate.memory ?? candidate.rawLabel ?? "")?.[1] ?? null;
    if (ram && candidateRam && ram !== candidateRam) return false;
    const candidateColor = samsungColorKey(candidate.color ?? stored?.parsedColor ?? null);
    if (candidateColor !== color) return false;
    const candidateCountry = countryCode(candidate.region ?? "") ?? countryCode(candidate.rawLabel ?? "");
    if (country && candidateCountry && country !== candidateCountry) return false;
    return true;
  });
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

/** Supplier calls the black Canon finish Graphite; the owner confirmed they are identical. */
export function matchCanonG7Variant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  if (!/^Canon PowerShot G7 X Mark III\b/i.test(line.parsedModel ?? "")) return null;
  const sourceColor = normalizeForMatch(line.parsedColor ?? "");
  if (sourceColor !== "graphite" && sourceColor !== "black") return null;
  const matches = candidates.filter((candidate) =>
    normalizeForMatch(candidate.productName) === "canon powershot g7 x mark iii" &&
    normalizeForMatch(candidate.color ?? (candidate.rawLabel ? parsePriceLine(candidate.rawLabel).parsedColor : "") ?? "") === "black",
  );
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

/** The 2022 64 GB Apple TV is the existing third-generation product, not a new card. */
export function matchAppleTv2022Variant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  if (!/^Apple TV 4K\b/i.test(line.parsedModel ?? "") || !/\b2022\b/.test(line.parsedModel ?? "")) return null;
  const capacity = normalizedMemory(line.parsedMemory);
  if (!capacity) return null;
  const matches = candidates.filter((candidate) =>
    normalizeForMatch(candidate.productName) === "apple tv 4k 3 го поколения" &&
    normalizedMemory(candidate.memory ?? (candidate.rawLabel ? parsePriceLine(candidate.rawLabel).parsedMemory : null)) === capacity,
  );
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

/** Only Black CIRQA is unambiguous; Gray and Mauve (RED) await owner confirmation. */
export function matchCirqaBlackVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  const source = line.parsedModel ?? "";
  if (!/^Cirqa Black\b/i.test(source)) return null;
  const size = /\b(S-M|L-XL)\b/i.exec(source)?.[1]?.toUpperCase();
  const region = size === "S-M" ? "s m" : size === "L-XL" ? "l xl" : null;
  if (!region) return null;
  const matches = candidates.filter((candidate) =>
    normalizeForMatch(candidate.productName) === "garmin cirqa smart band" &&
    normalizeForMatch(candidate.color ?? "") === "black" &&
    normalizeForMatch(candidate.region ?? "") === region,
  );
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

function macbookFamily(text: string | null): string | null {
  if (!text || !/\bmacbook\b/i.test(text)) return null;
  const source = text.replace(/\bM[A-Z0-9]{4,5}\b/g, " ");
  if (/\bneo\b/i.test(source)) return "neo";
  const match = /\b(air|pro)\s*(13|14|15|16)(?:-inch)?\b/i.exec(source);
  return match ? match[1].toLowerCase() + "-" + match[2] : null;
}

function macbookChip(text: string | null): string | null {
  if (!text) return null;
  const match = /\b(M5(?:\s*(?:Pro|Max))?|A18(?:\s*Pro)?)\b/i.exec(text);
  return match?.[1].toLowerCase().replace(/\s+/g, " ") ?? null;
}

function macbookRam(text: string | null): string | null {
  if (!text) return null;
  const source = /\b(?:M5(?:\s*(?:Pro|Max))?|A18(?:\s*Pro)?)\s*[, ]\s*(\d{1,3})\s*(?:GB|ГБ|\/|\s)/i.exec(text)?.[1];
  return source ?? /\b(8|16|24|32|36|48|64|96|128)\s*(?:GB|ГБ)\s*[/,]\s*(?:256|512|1|2|4)\s*(?:GB|ГБ|TB|ТБ)/i.exec(text)?.[1]
    ?? /^(8|16|24|32|36|48|64|96|128)\s*(?:GB|ГБ)\b/i.exec(text)?.[1] ?? null;
}

/** Human-readable laptop identity, without silently inventing missing catalog fields. */
export function describeMacBookConfiguration(
  model: string | null,
  memoryText: string | null,
  color: string | null,
): { label: string; chip: string | null; ram: string | null } | null {
  const family = macbookFamily(model);
  if (!family) return null;
  const chip = macbookChip(model);
  const ram = macbookRam(memoryText) ?? macbookRam(model);
  const storage = storageKey(memoryText) ?? memory(model ?? "");
  const [kind, inches] = family.split("-");
  const label = [
    `MacBook ${kind === "neo" ? "Neo" : kind === "air" ? "Air" : "Pro"}${inches ? ` ${inches}″` : ""}`,
    chip?.toUpperCase().replace(" PRO", " Pro").replace(" MAX", " Max") ?? "чип не указан",
    ram ? `${ram} ГБ ОЗУ` : "ОЗУ не указано",
    storage ? `${storage.toUpperCase()} SSD` : "накопитель не указан",
    color,
  ].filter(Boolean).join(" · ");
  return { label, chip, ram };
}

/** Require family, chip, RAM, SSD and finish before matching a MacBook offer. */
export function matchMacBookVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  const source = line.parsedModel;
  const family = macbookFamily(source);
  const chip = macbookChip(source);
  const ram = macbookRam(source);
  const storage = normalizedMemory(line.parsedMemory);
  const color = normalizeForMatch(line.parsedColor ?? "");
  if (!family || !chip || !ram || !storage || !color) return null;
  const matches = candidates.filter((candidate) => {
    if (macbookFamily(candidate.productName) !== family) return false;
    const candidateChip = macbookChip([candidate.region, candidate.rawLabel, candidate.productName].filter(Boolean).join(" "));
    if (family !== "neo" && candidateChip !== chip) return false;
    if (family === "neo" && !chip.startsWith("a18")) return false;
    if (macbookRam(candidate.memory) !== ram) return false;
    const candidateStorage = storageKey(candidate.memory);
    if (candidateStorage !== storage) return false;
    return normalizeForMatch(candidate.color ?? "") === color;
  });
  return matches.length === 1 ? matches[0]?.id ?? null : null;
}

function ipadFamily(text: string | null): string | null {
  if (!text) return null;
  const source = normalizeForMatch(text);
  if (/^ipad 11\b/.test(source) || /^ipad a16\b/.test(source)) return "base-a16";
  const numberedAir = /^ipad air (6|7) (11|13) m(2|3)\b/.exec(source);
  if (numberedAir) {
    if ((numberedAir[1] === "6" && numberedAir[3] !== "2") ||
      (numberedAir[1] === "7" && numberedAir[3] !== "3")) return null;
    return `air-${numberedAir[2]}-m${numberedAir[3]}`;
  }
  const air8 = /^ipad air 8 (11|13)\b/.exec(source);
  if (air8) return "air-" + air8[1] + "-m4";
  const air = /^ipad air (11|13)(?: inch)?\b/.exec(source);
  if (air) {
    const chip = /\bm[234]\b/.exec(source)?.[0];
    return chip ? "air-" + air[1] + "-" + chip : null;
  }
  const pro = /^ipad pro (11|13)(?: inch)?\b/.exec(source);
  if (pro) {
    const chip = /\bm5\b/.exec(source)?.[0];
    return chip ? "pro-" + pro[1] + "-" + chip : null;
  }
  return null;
}

function ipadConnection(text: string | null): "wifi" | "cellular" | null {
  if (!text) return null;
  if (/\b(?:LTE|Cellular|5G)\b/i.test(text)) return "cellular";
  if (/\bWi[\s-]?Fi\b/i.test(text)) return "wifi";
  return null;
}

/** Model generation, size, storage, finish and Wi-Fi/LTE must be compatible. */
export function matchIPadVariant(
  line: ParsedPriceLine,
  candidates: SupplierVariantCandidate[],
): string | null {
  const family = ipadFamily(line.parsedModel);
  const storage = normalizedMemory(line.parsedMemory);
  const color = normalizeForMatch(line.parsedColor ?? "");
  const connection = ipadConnection(line.parsedModel);
  if (!family || !storage || !color || !connection) return null;
  const matches = candidates.filter((candidate) => {
    if (ipadFamily(candidate.productName) !== family) return false;
    if (normalizedMemory(candidate.memory ?? (candidate.rawLabel ? parsePriceLine(candidate.rawLabel).parsedMemory : null)) !== storage) return false;
    if (normalizeForMatch(candidate.color ?? "") !== color) return false;
    const candidateConnection = ipadConnection([candidate.region, candidate.rawLabel].filter(Boolean).join(" "));
    if (candidateConnection && candidateConnection !== connection) return false;
    if (!candidateConnection && connection === "cellular") return false;
    return true;
  });
  return matches.length === 1 ? matches[0]?.id ?? null : null;
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
  if (/\b(?:1\s*sim\s*\+\s*e\s*sim|nano[- ]?sim\s*\+\s*e\s*sim|sim\s*\+\s*e\s*sim|sim\s*[_-]\s*e\s*sim|sim\s+esim)\b/i.test(text)) return "SIM+eSIM";
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
    // The owner confirmed that the Chinese iPhone 16e in this feed is 2 SIM.
    // Do not transfer that exception to the 17e or future generations.
    if (generation === 17 && /\be\b/i.test(model)) return null;
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

/** Canonical storage key; older catalogue rows may store only the number. */
export function normalizedMemory(text: string | null): string | null {
  if (!text?.trim()) return null;
  const normalized = normalizeForMatch(text);
  const bare = /^(\d+)$/.exec(normalized);
  if (bare) {
    const amount = Number(bare[1]);
    return `${amount}${amount <= 4 ? "tb" : "gb"}`;
  }
  const capacity = /^(\d+)\s*(gb|tb)$/.exec(normalized);
  if (!capacity) return normalized;
  return `${capacity[1]}${capacity[2]}`;
}

function parsedFields(rawLine: string, inherited: HeaderContext = { model: null, sim: null, country: null, nonActive: false }): ParsedPriceLine {
  const raw = stripMarkup(rawLine);
  const { value: parsedPrice, start } = findPrice(raw);
  const requestLabel = isPriceOnRequest(raw)
    ? raw.replace(/\s*[-–—]\s*(?:по\s+запросу|0\s*(?:₽|р\.?|руб\.?)?)\s*$/iu, "")
    : raw;
  const parsedModel = start === null ? requestLabel || null : raw.slice(0, start).replace(/[-–—\s]+$/u, "").trim() || null;
  const source = parsedModel ?? raw;
  const isIphoneContinuation = /^\d{2,4}\s*(?:GB|ГБ|TB|ТБ)?\s+(?:black|silver|blue|orange|white|glacier|glaicer|burgundy|lavender|sage|green|pink|midnight|starlight|purple|yellow|teal|ultramarine|natural|desert|gold|red)\b/i.test(source);
  const parsedProduct = modelName(source) ?? (isIphoneContinuation ? inherited.model : null);
  const parsedMemory = memory(source);
  const parsedColor = supplierWatchCaseColor(source)
    ?? COLOR_ALIASES.find(([pattern]) => pattern.test(source))?.[1] ?? null;
  // Apple part numbers (e.g. MW493, MEQU4) are more reliable than a free-form
  // title for accessories and watch variants. Avoid short family tokens such
  // as S10/M4 and capacity/year numbers.
  const parsedSku = hasApplePartNumber(source) ? source.match(APPLE_PART_NUMBER_RE)?.at(-1) ?? null : null;
  const country = countryCode(source) ?? inherited.country;
  const sim = explicitSim(source) ?? inherited.sim ?? inferIphoneSim(parsedProduct, country);
  const parsedRegion = /\bapple\s+watch\b/i.test(source)
    ? watchStrapSize(source)
    : parsedProduct?.startsWith("iPhone ")
      ? sim
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
    if (line === "[[PRICE_SOURCE_BOUNDARY]]") {
      header = { model: null, sim: null, country: null, nonActive: false };
      continue;
    }
    // Condition-marked offers are explicitly excluded; known model families
    // such as Watch S10, Mac Studio, Garmin and Yandex remain importable.
    if (IGNORE_PRICE_LINE_RE.test(line) || BULK_PRICE_LINE_RE.test(line)) continue;
    const parsed = parsedFields(line, header);
    if (parsed.parsedPrice === null) {
      const model = modelName(line);
      if (isPriceOnRequest(line) || (parsed.parsedMemory && parsed.parsedColor && parsed.phoneModel)) result.push(parsed);
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

/** Zero and explicit request quotes mean no public numeric price. */
export function isPriceOnRequest(line: string): boolean {
  return /(?:^|[^\p{L}])по\s+запросу(?=$|[^\p{L}])/iu.test(line)
    || /[-–—]\s*0\s*(?:₽|р\.?|руб\.?)?\s*$/iu.test(line);
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

/**
 * Stable identity for non-iPhone offers: country and Apple part number are
 * supply details, not storefront options. Keep model/configuration words
 * (including case size, band size, colour, capacity and SIM text) intact.
 */
export function supplierIdentityKey(text: string | null): string | null {
  if (!text?.trim()) return null;
  let identity = text.replace(CONDITION_NOTE_RE, " ")
    .replace(/\p{Regional_Indicator}{2}/gu, " ")
    .replace(/\bapple\s+watch\s+s(?:eries)?\s*(10|11|12)\b/gi, "Apple Watch Series $1")
    .replace(/\bapple\s+watch\s+se\s*(2|3)\b/gi, "Apple Watch SE $1");
  for (const [countryPattern] of COUNTRY_ALIASES) identity = identity.replace(countryPattern, " ");
  if (hasApplePartNumber(identity)) identity = identity.replace(APPLE_PART_NUMBER_RE, " ");
  return normalizeForMatch(identity) || null;
}

export type AcceptedSupplierMapping = {
  sourceLabel: string | null;
  variantId: string;
};

/** Learn stable non-iPhone supplier labels only after an admin confirms a target. */
export function buildAcceptedSupplierMappings(rows: AcceptedSupplierMapping[]): Map<string, string> {
  const targets = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.sourceLabel || canonicalIphoneModel(row.sourceLabel)) continue;
    const key = supplierIdentityKey(row.sourceLabel);
    if (!key) continue;
    const ids = targets.get(key) ?? new Set<string>();
    ids.add(row.variantId);
    targets.set(key, ids);
  }
  const mappings = new Map<string, string>();
  for (const [key, ids] of targets) {
    if (ids.size !== 1) continue;
    const [variantId] = ids;
    if (variantId) mappings.set(key, variantId);
  }
  return mappings;
}

/** Country-neutral identity for learning an admin-confirmed iPhone mapping. */
export function iphoneOfferMatchKey(
  model: string | null,
  memoryValue: string | null,
  colorValue: string | null,
  regionValue: string | null,
  nonActive = false,
): string | null {
  const canonicalModel = canonicalIphoneModel(model ?? "");
  const canonicalMemory = normalizedMemory(memoryValue);
  if (!canonicalModel || !canonicalMemory || !colorValue?.trim()) return null;
  const sim = normalizedIphoneSim(regionValue, canonicalModel) ?? regionValue;
  if (!sim) return null;
  return [
    canonicalModel,
    canonicalMemory,
    normalizeForMatch(colorValue),
    normalizeForMatch(sim),
    nonActive ? "inactive" : "regular",
  ].join("|");
}

export type AcceptedIphoneMapping = {
  model: string | null;
  memory: string | null;
  color: string | null;
  region: string | null;
  nonActive?: boolean;
  variantId: string;
};

/** Keep only mappings that have one consistent, previously accepted target. */
export function buildAcceptedIphoneMappings(rows: AcceptedIphoneMapping[]): Map<string, string> {
  const targets = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = iphoneOfferMatchKey(row.model, row.memory, row.color, row.region, row.nonActive);
    if (!key) continue;
    const ids = targets.get(key) ?? new Set<string>();
    ids.add(row.variantId);
    targets.set(key, ids);
  }
  const mappings = new Map<string, string>();
  for (const [key, ids] of targets) {
    if (ids.size !== 1) continue;
    const [variantId] = ids;
    if (variantId) mappings.set(key, variantId);
  }
  return mappings;
}

/**
 * A supplier may include an explicit SIM type while a legacy catalog variant
 * has no SIM metadata. Allow that mapping only when the exact model/memory/
 * color bucket contains one sole variant and that variant is truly unspecified.
 */
export function uniqueUnspecifiedIphoneVariantId(
  candidates: Array<{ id: string; region: string | null; rawLabel: string | null }>,
  model: string,
): string | null {
  if (candidates.length !== 1) return null;
  const candidate = candidates[0];
  if (!candidate) return null;
  const labelRegion = candidate.rawLabel ? parsePriceLine(candidate.rawLabel).parsedRegion : null;
  if (normalizedIphoneSim(candidate.region, model) || normalizedIphoneSim(labelRegion, model)) return null;
  return candidate.id;
}
