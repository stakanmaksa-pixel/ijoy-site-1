export type AppleKeyboardVariant = {
  color: "White" | "Black";
  price: number;
  rawLabel: string;
  image: string;
};

export type AppleKeyboardProduct = {
  slug: string;
  name: string;
  description: string;
  highlights: string[];
  specs: Record<string, string>;
  variants: AppleKeyboardVariant[];
};

const asset = (file: string) => `/catalog/product-photos/apple-keyboards/${file}`;

export const APPLE_KEYBOARD_ASSETS = {
  pro11White: asset("magic-keyboard-ipad-pro-11-white.jpg"),
  pro11Black: asset("magic-keyboard-ipad-pro-11-black.jpg"),
  pro13White: asset("magic-keyboard-ipad-pro-13-white.jpg"),
  pro13Black: asset("magic-keyboard-ipad-pro-13-black.jpg"),
  air11White: asset("magic-keyboard-ipad-air-11-white.jpg"),
  air11Black: asset("magic-keyboard-ipad-air-11-black.jpg"),
  air13White: asset("magic-keyboard-ipad-air-13-white.jpg"),
  air13Black: asset("magic-keyboard-ipad-air-13-black.jpg"),
  folioWhite: asset("magic-keyboard-folio-ipad-a16-white.jpg"),
} as const;

// Цены взяты из страницы Store77, которую прислал пользователь. Один товар
// объединяет цветовые варианты, чтобы не создавать дубли в каталоге.
export const APPLE_KEYBOARD_CATALOG: AppleKeyboardProduct[] = [
  {
    slug: "magic-keyboard-ipad-pro-11-m5",
    name: "Magic Keyboard для iPad Pro 11″ M5",
    description: "Оригинальная Magic Keyboard для iPad Pro 11″ (M5). Клавиатура крепится магнитно, защищает планшет с двух сторон и превращает его в компактное рабочее место с большим трекпадом.",
    highlights: [
      "Только для iPad Pro 11″ с M4 или M5 — не подходит к iPad Air 11″",
      "Подсветка клавиш, ряд из 14 функциональных клавиш и алюминиевая подладонная панель",
      "Большой трекпад с тактильной отдачей и жестами Multi‑Touch",
      "USB‑C для сквозной зарядки iPad; подключение и питание через Smart Connector",
    ],
    specs: {
      "Совместимые модели iPad": "iPad Pro 11″ (M5 и M4)",
      "Подключение": "Smart Connector; Bluetooth и отдельная зарядка не требуются",
      "Клавиши": "Подсветка, ножничный механизм, ряд из 14 функциональных клавиш",
      "Трекпад": "Стеклянный, увеличенный, с тактильной отдачей",
      "Порт": "USB‑C для сквозной зарядки iPad",
      "Важно": "Не совместима с iPad Air 11″ и iPad Pro предыдущего дизайна",
    },
    variants: [
      { color: "White", price: 38710, rawLabel: "Magic Keyboard для iPad Pro 11″ M5 (Белая)", image: APPLE_KEYBOARD_ASSETS.pro11White },
      { color: "Black", price: 39350, rawLabel: "Magic Keyboard для iPad Pro 11″ M5 (Чёрная)", image: APPLE_KEYBOARD_ASSETS.pro11Black },
    ],
  },
  {
    slug: "magic-keyboard-ipad-pro-13-m5",
    name: "Magic Keyboard для iPad Pro 13″ M5",
    description: "Оригинальная Magic Keyboard для большого iPad Pro 13″ (M5): магнитное крепление, регулируемый угол обзора, подсветка и трекпад с тактильной отдачей.",
    highlights: [
      "Только для iPad Pro 13″ с M4 или M5 — диагональ 11″ не подходит",
      "Подсветка клавиш, ряд из 14 функциональных клавиш и алюминиевая подладонная панель",
      "Большой трекпад с тактильной отдачей и жестами Multi‑Touch",
      "USB‑C для сквозной зарядки iPad; подключение и питание через Smart Connector",
    ],
    specs: {
      "Совместимые модели iPad": "iPad Pro 13″ (M5 и M4)",
      "Подключение": "Smart Connector; Bluetooth и отдельная зарядка не требуются",
      "Клавиши": "Подсветка, ножничный механизм, ряд из 14 функциональных клавиш",
      "Трекпад": "Стеклянный, увеличенный, с тактильной отдачей",
      "Порт": "USB‑C для сквозной зарядки iPad",
      "Важно": "Не совместима с iPad Pro 11″ или iPad Air 13″",
    },
    variants: [
      { color: "White", price: 51870, rawLabel: "Magic Keyboard для iPad Pro 13″ M5 (Белая)", image: APPLE_KEYBOARD_ASSETS.pro13White },
      { color: "Black", price: 40500, rawLabel: "Magic Keyboard для iPad Pro 13″ M5 (Чёрная)", image: APPLE_KEYBOARD_ASSETS.pro13Black },
    ],
  },
  {
    slug: "magic-keyboard-ipad-air-11-m4",
    name: "Magic Keyboard для iPad Air 11″ M4",
    description: "Magic Keyboard для iPad Air 11″ с M2, M3 или M4. Тонкая клавиатура с трекпадом, рядом функциональных клавиш и USB‑C для сквозной зарядки планшета.",
    highlights: [
      "Совместима с iPad Air 11″ на M2, M3 и M4",
      "Ряд из 14 функциональных клавиш и большой стеклянный трекпад",
      "Магнитное крепление, регулируемый угол обзора и защита с двух сторон",
      "USB‑C для сквозной зарядки; требуется iPadOS 18.3 или новее",
    ],
    specs: {
      "Совместимые модели iPad": "iPad Air 11″ (M4, M3 и M2)",
      "Подключение": "Smart Connector; Bluetooth и отдельная зарядка не требуются",
      "Клавиши": "Ножничный механизм, ряд из 14 функциональных клавиш",
      "Трекпад": "Большой стеклянный, с поддержкой Multi‑Touch",
      "Порт": "USB‑C для сквозной зарядки iPad",
      "Системные требования": "iPadOS 18.3 или новее",
      "Важно": "Не совместима с iPad Pro 11″ и iPad Air 13″",
    },
    variants: [
      { color: "White", price: 38700, rawLabel: "Magic Keyboard для iPad Air 11″ M4 (Белая)", image: APPLE_KEYBOARD_ASSETS.air11White },
      { color: "Black", price: 40010, rawLabel: "Magic Keyboard для iPad Air 11″ M4 (Чёрная)", image: APPLE_KEYBOARD_ASSETS.air11Black },
    ],
  },
  {
    slug: "magic-keyboard-ipad-air-13-m4",
    name: "Magic Keyboard для iPad Air 13″ M4",
    description: "Magic Keyboard для iPad Air 13″ с M2, M3 или M4. Полноразмерная рабочая станция с плавающей конструкцией, трекпадом и сквозной зарядкой по USB‑C.",
    highlights: [
      "Совместима с iPad Air 13″ на M2, M3 и M4",
      "Ряд из 14 функциональных клавиш и большой стеклянный трекпад",
      "Магнитное крепление, регулируемый угол обзора и защита с двух сторон",
      "USB‑C для сквозной зарядки; требуется iPadOS 18.3 или новее",
    ],
    specs: {
      "Совместимые модели iPad": "iPad Air 13″ (M4, M3 и M2)",
      "Подключение": "Smart Connector; Bluetooth и отдельная зарядка не требуются",
      "Клавиши": "Ножничный механизм, ряд из 14 функциональных клавиш",
      "Трекпад": "Большой стеклянный, с поддержкой Multi‑Touch",
      "Порт": "USB‑C для сквозной зарядки iPad",
      "Системные требования": "iPadOS 18.3 или новее",
      "Важно": "Не совместима с iPad Pro 13″ и iPad Air 11″",
    },
    variants: [
      { color: "White", price: 37860, rawLabel: "Magic Keyboard для iPad Air 13″ M4 (Белая)", image: APPLE_KEYBOARD_ASSETS.air13White },
      { color: "Black", price: 37300, rawLabel: "Magic Keyboard для iPad Air 13″ M4 (Чёрная)", image: APPLE_KEYBOARD_ASSETS.air13Black },
    ],
  },
  {
    slug: "magic-keyboard-folio-ipad-a16",
    name: "Magic Keyboard Folio для iPad A16",
    description: "Двухкомпонентная Magic Keyboard Folio для iPad A16: съёмная клавиатура, защитная задняя панель с подставкой, трекпад и ряд функциональных клавиш.",
    highlights: [
      "Совместима с iPad A16; подходит также к iPad 10‑го поколения",
      "Съёмная клавиатура и отдельная магнитная задняя панель с регулируемой подставкой",
      "Большой трекпад с поддержкой Multi‑Touch и ряд из 14 функциональных клавиш",
      "Подключение и питание через Smart Connector; требуется iPadOS 18.3 или новее",
    ],
    specs: {
      "Совместимые модели iPad": "iPad A16; iPad 10‑го поколения",
      "Подключение": "Smart Connector; Bluetooth и отдельная зарядка не требуются",
      "Конструкция": "Съёмная клавиатура и магнитная задняя панель с регулируемой подставкой",
      "Клавиши": "Ножничный механизм, ряд из 14 функциональных клавиш",
      "Трекпад": "Большой click‑anywhere с поддержкой Multi‑Touch",
      "Системные требования": "iPadOS 18.3 или новее",
      "Важно": "Не подходит к iPad Air, iPad Pro и iPad mini",
    },
    variants: [
      { color: "White", price: 36000, rawLabel: "Magic Keyboard Folio для iPad A16 (Белая)", image: APPLE_KEYBOARD_ASSETS.folioWhite },
    ],
  },
];
