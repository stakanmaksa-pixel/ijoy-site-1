// Разбор текста прайса, присланного Telegram-ботом.
//
// Формат строки прайса (как в bot_v2.py): произвольное описание модели,
// затем в конце строки — цена. Например:
//   17 Pro Max 256GB Blue 🇯🇵 97000
//
// Мы намеренно не пытаемся жёстко распарсить модель/память/цвет — это
// делает интерфейс админки при сопоставлении (см. /admin/price-import).
// Здесь мы извлекаем то, что можно извлечь надёжно (цену, объём памяти,
// флаг региона), а остальное отдаём как есть для сопоставления с уже
// существующими модификациями по нормализованному тексту строки.

export interface ParsedPriceLine {
  rawLine: string;
  parsedModel: string | null;
  parsedMemory: string | null;
  parsedColor: string | null;
  parsedRegion: string | null;
  parsedPrice: number | null;
}

const MEMORY_RE = /(\d+)\s?(GB|ГБ|TB|ТБ)\b/i;
const FLAG_RE = /\p{Regional_Indicator}{2}/u;
// ₽, "руб", "руб.", "р." — приклеенные к числу без пробела (известный баг бота
// в старой версии: наценка не применялась к таким строкам).
const CURRENCY_SUFFIX_RE = /(₽|руб\.?|р\.?)+$/i;

function parsePriceToken(rawToken: string): number | null {
  let t = rawToken.trim();
  t = t.replace(CURRENCY_SUFFIX_RE, "").trim();
  if (!t) return null;

  const hasComma = t.includes(",");
  const hasDot = t.includes(".");

  if (hasComma && hasDot) {
    t = t.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    const parts = t.split(",");
    // "97,50" похоже на копейки, "97,000" — на разделитель тысяч
    if (parts.length === 2 && parts[1].length <= 2) {
      t = parts.join(".");
    } else {
      t = t.replace(/,/g, "");
    }
  }

  if (!/^\d+(\.\d+)?$/.test(t)) return null;

  const value = Number(t);
  return Number.isFinite(value) ? value : null;
}

export function parsePriceLine(line: string): ParsedPriceLine {
  const rawLine = line.trim();
  if (!rawLine) {
    return {
      rawLine,
      parsedModel: null,
      parsedMemory: null,
      parsedColor: null,
      parsedRegion: null,
      parsedPrice: null,
    };
  }

  const tokens = rawLine.split(/\s+/);
  const lastToken = tokens[tokens.length - 1];
  const parsedPrice = parsePriceToken(lastToken);
  const modelTokens = parsedPrice !== null ? tokens.slice(0, -1) : tokens;
  const parsedModel = modelTokens.join(" ").trim() || null;

  const memoryMatch = parsedModel?.match(MEMORY_RE) ?? null;
  const parsedMemory = memoryMatch
    ? `${memoryMatch[1]}${memoryMatch[2].toUpperCase().startsWith("T") ? "TB" : "GB"}`
    : null;

  const flagMatch = parsedModel?.match(FLAG_RE) ?? null;
  const parsedRegion = flagMatch ? flagMatch[0] : null;

  return {
    rawLine,
    parsedModel,
    parsedMemory,
    parsedColor: null,
    parsedRegion,
    parsedPrice,
  };
}

export function parsePriceListText(text: string): ParsedPriceLine[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parsePriceLine);
}

/**
 * Нормализация строки для сопоставления с ProductVariant.rawLabel:
 * без учёта регистра, пунктуации и лишних пробелов.
 */
export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}
