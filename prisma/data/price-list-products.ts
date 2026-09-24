/** Products explicitly present in the owner's current supplier price list. */
export type PriceListProduct = {
  slug: string;
  name: string;
  category: "aksessuary" | "daisony";
  brand: string;
  description: string;
  variants: Array<{
    color?: string;
    sku?: string;
    price: number;
    rawLabel: string;
  }>;
};

export const PRICE_LIST_PRODUCTS: PriceListProduct[] = [
  {
    slug: "apple-usb-c-lightning-cable-1m",
    name: "Apple USB-C — Lightning 1 м",
    category: "aksessuary",
    brand: "Apple",
    description: "Кабель Apple USB-C — Lightning длиной 1 м.",
    variants: [{ price: 1700, rawLabel: "Apple USB-C - Lightning 1M" }],
  },
  {
    slug: "apple-60w-usb-c-cable-1m",
    name: "Apple 60W USB-C Cable 1 м",
    category: "aksessuary",
    brand: "Apple",
    description: "Кабель Apple USB-C мощностью до 60 Вт, длина 1 м.",
    variants: [{ sku: "MW493", price: 2400, rawLabel: "Apple 60W USB-C Cable 1M MW493" }],
  },
  {
    slug: "apple-240w-usb-c-cable-2m",
    name: "Apple 240W USB-C Cable 2 м",
    category: "aksessuary",
    brand: "Apple",
    description: "Кабель Apple USB-C мощностью до 240 Вт, длина 2 м.",
    variants: [{ sku: "MYQT3", price: 3000, rawLabel: "Apple 240W USB-C Cable 2M MYQT3" }],
  },
  {
    slug: "apple-20w-adapter-copy",
    name: "Apple 20W Adapter (копия)",
    category: "aksessuary",
    brand: "Apple",
    description: "Копия адаптера питания Apple мощностью 20 Вт.",
    variants: [{ price: 1000, rawLabel: "Apple 20W Adapter Copy" }],
  },
  {
    slug: "apple-25w-magsafe-charger-qi22",
    name: "Apple 25W MagSafe Charger 2 м (Qi2.2)",
    category: "aksessuary",
    brand: "Apple",
    description: "Зарядное устройство Apple MagSafe мощностью до 25 Вт, кабель 2 м, Qi2.2.",
    variants: [{ price: 3700, rawLabel: "Apple 25W MagSafe Charger 2M (Qi2.2)" }],
  },
  {
    slug: "apple-dynamic-power-usb-c-40-60w",
    name: "Apple Dynamic Power USB-C 40–60W",
    category: "aksessuary",
    brand: "Apple",
    description: "Адаптер питания Dynamic Power USB-C с мощностью 40–60 Вт.",
    variants: [{ price: 4300, rawLabel: "Apple 40-60W Dynamic Power USB-C 🇸🇬" }],
  },
  {
    slug: "apple-magic-trackpad-3",
    name: "Apple Magic Trackpad 3",
    category: "aksessuary",
    brand: "Apple",
    description: "Беспроводной трекпад Apple Magic Trackpad 3, чёрный.",
    variants: [{ color: "Black", price: 10900, rawLabel: "Apple Magic Trackpad 3 Black" }],
  },
  {
    slug: "apple-magic-keyboard-usb-c",
    name: "Apple Magic Keyboard USB-C",
    category: "aksessuary",
    brand: "Apple",
    description: "Беспроводная клавиатура Apple Magic Keyboard с разъёмом USB-C, белая.",
    variants: [{ color: "White", price: 9000, rawLabel: "Apple Magic Keyboard White USB-C" }],
  },
  {
    slug: "dyson-airwrap-complete-long-hs05",
    name: "Dyson Airwrap Complete Long HS05 Copper/Nickel",
    category: "daisony",
    brand: "Dyson",
    description: "Мультистайлер Dyson Airwrap Complete Long HS05 в цвете Copper/Nickel.",
    variants: [{ color: "Copper/Nickel", price: 30200, rawLabel: "Dyson Airwrap Complete Long HS05 Copper/Nickel 🇨🇳" }],
  },
];
