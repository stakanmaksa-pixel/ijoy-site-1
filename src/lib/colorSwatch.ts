// Цвет модификации → его "физический" вид для кружка-свотча в выборе
// модификации (ProductOrder.tsx). Точное совпадение по названию (без учёта
// регистра) → эвристика по ключевым словам внутри названия → серая
// заглушка, если ничего не подошло.

const EXACT: Record<string, string> = {
  black: "#1c1c1e",
  white: "#f5f5f7",
  silver: "#e3e4e6",
  gold: "#e8d5b0",
  graphite: "#4b4b4d",
  midnight: "#1b1b2b",
  starlight: "#f0e6d8",
  "space gray": "#535154",
  "space grey": "#535154",
  titanium: "#8a8a8d",
  "natural titanium": "#8a8a8d",
  "blue titanium": "#4f5b66",
  "white titanium": "#e6e2da",
  "black titanium": "#3b3a38",
  "desert titanium": "#b5a186",
  blue: "#3f6fb5",
  navy: "#1c2b4a",
  "light blue": "#a9c4e0",
  "icy blue": "#bcd6e8",
  red: "#b5342f",
  "product red": "#b5342f",
  pink: "#e8c2c8",
  purple: "#7d6b9e",
  lavender: "#c9c1e0",
  violet: "#8a76b0",
  "deep purple": "#5b5877",
  green: "#5c7a5e",
  "alpine green": "#546a56",
  mint: "#a3c9b8",
  yellow: "#e8d16a",
  orange: "#d97a3f",
  coral: "#e0836a",
  cream: "#efe6d2",
  beige: "#dccbb0",
  "rose gold": "#e6c2bb",
  "sierra blue": "#a9c0d8",
  "phantom black": "#1c1c1e",
  "phantom silver": "#dcdde0",
  "phantom violet": "#7d6f9c",
  "awesome black": "#1c1c1e",
  "awesome white": "#f5f5f7",
  "awesome navy": "#1c2b4a",
  "awesome lavender": "#c9c1e0",
  "awesome lime": "#c7d94a",
  "awesome graphite": "#4b4b4d",
  "awesome iceblue": "#bcd6e8",
  "awesome mint": "#a3c9b8",
};

const KEYWORDS: [RegExp, string][] = [
  [/black|черн|чёрн|graphite/i, "#1c1c1e"],
  [/white|бел|starlight|cream/i, "#f2f0ea"],
  [/silver|серебр/i, "#dcdde0"],
  [/gold|золот/i, "#e8d5b0"],
  [/rose/i, "#e6c2bb"],
  [/navy|тёмно.?син|темно.?син/i, "#1c2b4a"],
  [/blue|голуб|син/i, "#4f7cb5"],
  [/green|зелен|зелён|mint|мят/i, "#5c8a68"],
  [/purple|violet|фиолет|лавандов|lavender/i, "#8a76b0"],
  [/red|красн/i, "#b5342f"],
  [/pink|розов/i, "#e0aab5"],
  [/orange|coral|оранж|персик/i, "#d9824f"],
  [/yellow|желт|жёлт/i, "#e0c355"],
  [/gray|grey|сер(?!ебр)/i, "#8e8e93"],
  [/beige|беж/i, "#dccbb0"],
];

// В прайсах производителей названия часто приходят по-английски. В базе
// сохраняем оригинал (он нужен менеджеру и для точной модификации), а
// покупателю показываем понятный русский вариант с оригиналом в скобках.
const RUSSIAN_NAMES: Record<string, string> = {
  black: "Чёрный", white: "Белый", silver: "Серебристый", gold: "Золотой",
  graphite: "Графитовый", midnight: "Тёмная ночь", starlight: "Сияющая звезда",
  "space gray": "Серый космос", "space grey": "Серый космос", titanium: "Титан",
  "natural titanium": "Натуральный титан", "blue titanium": "Синий титан",
  "white titanium": "Белый титан", "black titanium": "Чёрный титан",
  "desert titanium": "Пустынный титан", blue: "Синий", navy: "Тёмно-синий",
  "light blue": "Голубой", "icy blue": "Ледяной голубой", red: "Красный",
  "product red": "Красный (PRODUCT)RED", pink: "Розовый", purple: "Фиолетовый",
  lavender: "Лавандовый", violet: "Фиолетовый", "deep purple": "Тёмно-фиолетовый",
  green: "Зелёный", "alpine green": "Альпийский зелёный", mint: "Мятный",
  yellow: "Жёлтый", orange: "Оранжевый", coral: "Коралловый", cream: "Кремовый",
  beige: "Бежевый", "rose gold": "Розовое золото", "sierra blue": "Сьерра-синий",
  "phantom black": "Фантомный чёрный", "phantom silver": "Фантомный серебристый",
  "phantom violet": "Фантомный фиолетовый", "awesome black": "Классный чёрный",
  "awesome white": "Классный белый", "awesome navy": "Классный тёмно-синий",
  "awesome lavender": "Классный лавандовый", "awesome lime": "Классный лаймовый",
  "awesome graphite": "Классный графитовый", "awesome iceblue": "Классный ледяной голубой",
  "awesome mint": "Классный мятный", teal: "Бирюзовый", desert: "Пустынный",
};

export function colorLabel(name: string | null | undefined): string {
  if (!name) return "";
  const russian = RUSSIAN_NAMES[name.trim().toLowerCase()];
  return russian ? `${russian} (${name})` : name;
}

export function colorToHex(name: string | null | undefined): string {
  if (!name) return "#c7c7cc";
  const key = name.trim().toLowerCase();
  if (EXACT[key]) return EXACT[key];
  for (const [re, hex] of KEYWORDS) {
    if (re.test(key)) return hex;
  }
  return "#c7c7cc"; // не удалось распознать цвет — серая заглушка
}
