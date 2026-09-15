import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { pickCoverImage, pickVariantImages } from "@/lib/pickCoverImage";
import { getSamsungPhoneMenuGroup, SAMSUNG_PHONE_MENU_GROUPS } from "@/lib/samsungPhones";
import { unstable_cache } from "next/cache";
import { directModelLink, isIpadKeyboard, isSamsungPhone, modelLineMenuNode, samsungMemoryColorGrid } from "@/lib/catalogPresentation";
import { colorLabel } from "@/lib/colorSwatch";

// ---------------------------------------------------------------------
// Многоуровневое меню каталога (бургер-меню на мобильном / выпадающая
// панель на десктопе), в духе STORE77: категория → линейка → конкретная
// модель, клик по модели ведёт сразу на страницу товара.
//
// Список моделей всегда берётся из БД (актуален после каждого обновления
// прайса через бота), а вот на какие "линейки" внутри категории делить
// товары — задаётся здесь вручную: это меняется редко (появление новой
// линейки Apple, а не каждое обновление цен).
// ---------------------------------------------------------------------

export type CatalogNavLeaf = { label: string; href: string };
export type CatalogNavNode = {
  label: string;
  href?: string;
  children?: CatalogNavNode[];
};

// Порядок "новые модели сверху" по линейкам — заполняется вручную и
// меняется редко (выход нового поколения), в отличие от цен/остатков,
// которые обновляются через бота на каждой загрузке прайса. Названия —
// ровно то, что реально приходит из прайса и хранится в БД (см.
// соответствующие блоки в prisma/seed.ts); модели, которых сейчас нет в
// продаже, в списках не фигурируют — они появятся сами, как только
// появятся в прайсе, в правильном месте.
export const MODEL_DISPLAY_ORDER = {
  iphone: [
    "iPhone 18 Pro Max",
    "iPhone 18 Pro",
    "iPhone Duo",
    "iPhone 17 Pro Max",
    "iPhone 17 Pro",
    "iPhone Air",
    "iPhone 17e",
    "iPhone 17",
    "iPhone 16 Pro Max",
    "iPhone 16 Pro",
    "iPhone 16 Plus",
    "iPhone 16e",
    "iPhone 16",
    "iPhone 15",
    "iPhone 14",
    "iPhone 13",
  ],
  samsung: [
    "Samsung Galaxy S26 Ultra",
    "Samsung Galaxy S26+",
    "Samsung Galaxy S26",
    "Samsung Galaxy S26 FE",
    "Samsung Galaxy S25 Ultra",
    "Samsung Galaxy S25 Edge",
    "Samsung Galaxy S25 FE 5G",
    "Samsung Galaxy S25",
    "Samsung Galaxy S25+",
    "Samsung Galaxy Z Fold8 Ultra",
    "Samsung Galaxy Z Fold8",
    "Samsung Galaxy Z Flip8",
    "Samsung Galaxy Z Fold7",
    "Samsung Galaxy Z Flip7",
    "Samsung Galaxy Z Flip7 FE",
    "Samsung Galaxy A57 5G",
    "Samsung Galaxy A56 5G",
    "Samsung Galaxy A37 5G",
    "Samsung Galaxy A27 5G",
    "Samsung Galaxy A36",
    "Samsung Galaxy A26",
    "Samsung Galaxy A07",
    "Samsung Galaxy A17 4G",
  ],
  sony: ["Sony Xperia 1 VII"],
  pixel: ["Google Pixel 11 Pro Fold", "Google Pixel 11 Pro XL", "Google Pixel 11 Pro", "Google Pixel 11", "Google Pixel 10a"],
  xiaomi: ["Xiaomi 17 Ultra", "Xiaomi 17T Pro", "Xiaomi 17", "Xiaomi 17T", "REDMI Note 15 Pro+ 5G", "REDMI Note 15 Pro 5G", "REDMI Note 15 Pro", "REDMI Note 15 5G", "REDMI Note 15"],
  poco: ["POCO F9 Ultra", "POCO F8 Ultra", "POCO F8 Pro", "POCO X8 Pro Max", "POCO X8 Pro", "POCO C81 Pro"],
  samsungTablets: ["Samsung Galaxy Tab S11 Ultra", "Samsung Galaxy Tab S11", "Samsung Galaxy Tab S10+", "Samsung Galaxy Tab S10 Lite", "Samsung Galaxy Tab S10 FE", "Samsung Galaxy Tab S10 FE+", "Samsung Galaxy Tab A11", "Samsung Galaxy Tab A11+"],
  samsungWatches: ["Samsung Galaxy Watch Ultra 2", "Samsung Galaxy Watch 9"],
  ipad: [
    "Apple iPad Pro 11″ M5 (2025)",
    "Apple iPad Pro 13″ M5 (2025)",
    "Apple iPad Air 11″ M4 (2026)",
    "Apple iPad Air 13″ M4 (2026)",
    "Apple iPad A16 (2025)",
    "Apple iPad mini (A17 Pro)",
    "iPad Pro 11 (2025, M5)",
    "iPad Pro 11-inch (M5)",
    "iPad Pro 13-inch (M5)",
    "iPad Air 13-inch (M4)",
    "iPad Air 11-inch (M4)",
    "iPad (A16)",
    "iPad mini (A17 Pro)",
    "iPad Air 13 (2025, M3)",
    "iPad Air 11 (2025, M3)",
    "iPad 11 (2025)",
    "iPad Mini 7",
    "iPad Air 8 11",
  ],
  pencil: [
    "Apple Pencil Pro",
    "Apple Pencil (USB‑C)",
    "Apple Pencil (2‑го поколения)",
  ],
  keyboard: [
    "Magic Keyboard для iPad Pro 11″ M5",
    "Magic Keyboard для iPad Pro 13″ M5",
    "Magic Keyboard для iPad Air 11″ M4",
    "Magic Keyboard для iPad Air 13″ M4",
    "Magic Keyboard Folio для iPad A16",
  ],
  macbook: [
    "MacBook Neo",
    "MacBook Air 15-inch (M5)",
    "MacBook Air 13-inch (M5)",
    "MacBook Air 15",
    "MacBook Air 15 (2025, M4)",
    "MacBook Air 13",
    "MacBook Pro 14",
    "MacBook Pro 14 (2025, M5)",
  ],
  watch: ["Apple Watch Ultra 4", "Apple Watch Ultra 3", "Apple Watch Series 11", "Apple Watch SE 3"],
  airpods: [
    "AirPods Pro 3",
    "AirPods Pro 2 Type-C",
    "AirPods 4 ANC",
    "AirPods 4",
    "AirPods Max 2",
    "Apple EarPods USB-C",
  ],
  gopro: [
    "Insta360 X5",
    "Insta360 X3",
    "Insta360 GO Ultra",
    "Insta360 GO 3S",
    "DJI Osmo 360 Standard Combo",
    "DJI Osmo Mobile 7P",
    "GoPro HERO 13 (Black)",
    "GoPro HERO 12 (Black)",
    "Canon PowerShot G7 X Mark III",
    "Fujifilm Instax Mini 13",
  ],
  smartGlasses: [
    "Ray-Ban Meta Starfire Kylie Edition",
    "Meta Ray-Ban Display",
    "Ray-Ban Meta Wayfarer RW4012 (Gen 2)",
    "Ray-Ban Meta Headliner RW4013 (Gen 2)",
    "Ray-Ban Meta Skyler RW4014 (Gen 2)",
    "Ray-Ban Meta Blayzer Optics (Gen 2)",
    "Ray-Ban Meta Wayfarer RW4006 (Gen 1)",
    "Ray-Ban Meta Wayfarer RW4008 (Gen 1)",
    "Ray-Ban Meta Skyler RW4010 (Gen 1)",
  ],
  gameConsoles: [
    "PlayStation 5 Pro",
    "PlayStation 5 Slim с дисководом (ревизия 2)",
    "PlayStation 5 Slim Digital (ревизия 2)",
    "Nintendo Switch 2",
    "Nintendo Switch OLED",
    "Xbox Series X",
    "Valve Steam Machine",
  ],
  portableConsoles: [
    "PlayStation Portal Remote Player",
    "ASUS ROG Xbox Ally",
    "Lenovo Legion Go S SteamOS",
    "Steam Deck OLED",
    "Nintendo Switch Lite",
  ],
  vrHeadsets: ["Meta Quest 3", "Meta Quest 3S", "PlayStation VR2"],
  gamingAccessories: [
    "DualSense — лимитированные издания",
    "DualSense Edge",
    "DualSense для PS5",
    "Victrix Pro BFG",
    "Руль Logitech G923",
    "Руль Logitech G29",
    "Коробка передач Logitech Driving Force",
    "Зарядная станция для DualSense",
    "Дисковод для PS5",
    "Вертикальная подставка для PS5",
    "Док-станция для Steam Deck",
  ],
  fitness: ["Google Fitbit Air", "WHOOP"],
  portableAudio: [
    "Marshall Kilburn III",
    "Marshall Emberton III",
    "Marshall Middleton",
    "Marshall Stanmore III",
    "Marshall Woburn III",
  ],
  headphones: [
    "AirPods Pro 3",
    "AirPods Pro 2 Type-C",
    "AirPods 4 ANC",
    "AirPods 4",
    "AirPods Max 2",
    "Apple EarPods USB-C",
    "Sony PULSE Elite",
    "Sony PULSE 3D",
    "Marshall Major V",
  ],
} as const satisfies Record<string, readonly string[]>;

// Место товара в его списке "новые сверху"; товары без списка (или не
// найденные в нём) уходят в конец и между собой сохраняют прежний порядок
// (сортировка стабильная) — так что ничего не теряется и не ломается,
// если модель ещё не добавлена в список выше.
function rankInList(list: readonly string[] | undefined, name: string): number {
  if (!list) return Number.MAX_SAFE_INTEGER;
  const idx = list.indexOf(name);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

// Тот же выбор списка, что использует меню (см. LINE_MATCHERS/CATEGORY_ORDER
// ниже), но по категории+бренду+имени товара — нужен там, где линейки уже
// не сгруппированы отдельно (общий список каталога/карточек товаров).
function resolveOrderList(
  categorySlug: string,
  brand: string | null,
  name: string,
): readonly string[] | undefined {
  if (categorySlug === "telefony") {
    if (brand === "Apple") return MODEL_DISPLAY_ORDER.iphone;
    if (brand === "Samsung") return MODEL_DISPLAY_ORDER.samsung;
    if (brand === "Sony") return MODEL_DISPLAY_ORDER.sony;
    if (brand === "Google") return MODEL_DISPLAY_ORDER.pixel;
    if (brand === "Xiaomi") return MODEL_DISPLAY_ORDER.xiaomi;
    if (brand === "POCO") return MODEL_DISPLAY_ORDER.poco;
    return undefined;
  }
  if (categorySlug === "planshety") {
    if (brand === "Samsung") return MODEL_DISPLAY_ORDER.samsungTablets;
    if (/apple\s+pencil/i.test(name)) return MODEL_DISPLAY_ORDER.pencil;
    if (/magic\s+keyboard|keyboard\s+folio/i.test(name)) return MODEL_DISPLAY_ORDER.keyboard;
    return MODEL_DISPLAY_ORDER.ipad;
  }
  if (categorySlug === "noutbuki") return MODEL_DISPLAY_ORDER.macbook;
  if (categorySlug === "chasy") return brand === "Samsung" ? MODEL_DISPLAY_ORDER.samsungWatches : MODEL_DISPLAY_ORDER.watch;
  if (categorySlug === "ekshn-kamery") return MODEL_DISPLAY_ORDER.gopro;
  if (categorySlug === "smart-ochki") return MODEL_DISPLAY_ORDER.smartGlasses;
  if (categorySlug === "igrovye-pristavki") return MODEL_DISPLAY_ORDER.gameConsoles;
  if (categorySlug === "portativnye-konsoli") return MODEL_DISPLAY_ORDER.portableConsoles;
  if (categorySlug === "vr-garnitury") return MODEL_DISPLAY_ORDER.vrHeadsets;
  if (categorySlug === "igrovye-aksessuary") return MODEL_DISPLAY_ORDER.gamingAccessories;
  if (categorySlug === "fitnes-braslety") return MODEL_DISPLAY_ORDER.fitness;
  if (categorySlug === "portativnaya-akustika") return MODEL_DISPLAY_ORDER.portableAudio;
  if (categorySlug === "naushniki") return MODEL_DISPLAY_ORDER.headphones;
  if (categorySlug === "aksessuary" && /^(?:AirPods|Apple EarPods)/.test(name)) return MODEL_DISPLAY_ORDER.airpods;
  return undefined;
}

type CatalogNavProduct = { name: string; slug: string; brand: string | null };

type LineMatcher = {
  label: string;
  test: (name: string, brand: string | null) => boolean;
  groupHref?: string;
  directListing?: boolean;
  order?: readonly string[];
  buildChildren?: (items: CatalogNavProduct[]) => CatalogNavNode[];
};

function buildSamsungMenuGroups(items: CatalogNavProduct[]): CatalogNavNode[] {
  return SAMSUNG_PHONE_MENU_GROUPS.flatMap((group) => {
    const products = items.filter((item) => getSamsungPhoneMenuGroup(item.name, item.slug)?.label === group.label);
    return products.map(directModelLink);
  });
}

const LINE_MATCHERS: Record<string, LineMatcher[]> = {
  telefony: [
    {
      label: "Apple iPhone",
      test: (_n, brand) => brand === "Apple",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Apple")}`,
      order: MODEL_DISPLAY_ORDER.iphone,
    },
    {
      label: "Samsung Galaxy",
      test: (_n, brand) => brand === "Samsung",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Samsung")}`,
      order: MODEL_DISPLAY_ORDER.samsung,
      buildChildren: buildSamsungMenuGroups,
    },
    {
      label: "Sony Xperia",
      test: (_n, brand) => brand === "Sony",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Sony")}`,
      order: MODEL_DISPLAY_ORDER.sony,
    },
    {
      label: "Google Pixel",
      test: (_n, brand) => brand === "Google",
      groupHref: "/catalog?category=telefony&brand=Google",
      order: MODEL_DISPLAY_ORDER.pixel,
    },
    {
      label: "Xiaomi и REDMI",
      test: (_n, brand) => brand === "Xiaomi",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Xiaomi")}`,
      order: MODEL_DISPLAY_ORDER.xiaomi,
    },
    {
      label: "POCO",
      test: (_n, brand) => brand === "POCO",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("POCO")}`,
      order: MODEL_DISPLAY_ORDER.poco,
    },
    {
      label: "HUAWEI",
      test: (_n, brand) => brand === "HUAWEI",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("HUAWEI")}`,
    },
    {
      label: "HONOR",
      test: (_n, brand) => brand === "HONOR",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("HONOR")}`,
    },
    {
      label: "OnePlus",
      test: (_n, brand) => brand === "OnePlus",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("OnePlus")}`,
    },
  ],
  aksessuary: [
    { label: "Наушники AirPods", test: (name) => /airpods/i.test(name), order: MODEL_DISPLAY_ORDER.airpods },
    { label: "Apple TV", test: (name) => /apple\s*tv/i.test(name) },
  ],
  // В ноутбуках названия особенно длинные и раньше превращали меню в
  // неудобную простыню. Группы повторяют привычную структуру Apple:
  // Neo → Air (поколение и диагональ) → Pro (поколение). Клик по группе
  // показывает все модели этой серии в каталоге, наведение/тап — точные
  // конфигурации в следующей колонке.
  noutbuki: [
    { label: "Apple MacBook Neo", test: (name) => /macbook\s+neo/i.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Neo" },
    { label: "Apple MacBook Air M5 13\"", test: (name) => /macbook\s+air/i.test(name) && /m5/i.test(name) && /13/.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Air%20M5%2013" },
    { label: "Apple MacBook Air M5 15\"", test: (name) => /macbook\s+air/i.test(name) && /m5/i.test(name) && /15/.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Air%20M5%2015" },
    { label: "Apple MacBook Air M4 13\"", test: (name) => /macbook\s+air/i.test(name) && /m4/i.test(name) && /13/.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Air%20M4%2013" },
    { label: "Apple MacBook Air M4 15\"", test: (name) => /macbook\s+air/i.test(name) && /m4/i.test(name) && /15/.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Air%20M4%2015" },
    { label: "Apple MacBook Pro M5 14\"–16\"", test: (name) => /macbook\s+pro.*m5|macbook\s+pro\s+m5/i.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Pro%20M5" },
    { label: "Apple MacBook Pro M4 14\"–16\"", test: (name) => /macbook\s+pro.*m4|macbook\s+pro\s+m4/i.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Pro%20M4" },
    { label: "Apple MacBook Air — другие", test: (name) => /macbook\s+air/i.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Air" },
    { label: "Apple MacBook Pro — другие", test: (name) => /macbook\s+pro/i.test(name), groupHref: "/catalog?category=noutbuki&q=MacBook%20Pro" },
  ],
  planshety: [
    { label: "Apple iPad", test: (name, brand) => brand === "Apple" && /ipad/i.test(name) && !/apple\s+pencil|magic\s+keyboard|keyboard\s+folio/i.test(name), groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("Apple")}`, order: MODEL_DISPLAY_ORDER.ipad },
    { label: "Стилусы", test: (name, brand) => brand === "Apple" && /apple\s+pencil/i.test(name), groupHref: "/catalog?category=planshety&q=Apple%20Pencil", order: MODEL_DISPLAY_ORDER.pencil },
    { label: "Клавиатуры для iPad", test: (name, brand) => brand === "Apple" && /magic\s+keyboard|keyboard\s+folio/i.test(name), groupHref: "/catalog?category=planshety&q=Magic%20Keyboard", order: MODEL_DISPLAY_ORDER.keyboard, directListing: true },
    { label: "Samsung Galaxy Tab", test: (name, brand) => brand === "Samsung" && /^Samsung Galaxy Tab/i.test(name), groupHref: "/catalog?category=planshety&brand=Samsung&q=Samsung%20Galaxy%20Tab", order: MODEL_DISPLAY_ORDER.samsungTablets },
    { label: "S Pen для Samsung", test: (name, brand) => brand === "Samsung" && /S Pen/i.test(name), groupHref: "/catalog?category=planshety&brand=Samsung&q=S%20Pen", directListing: true },
    { label: "Клавиатуры для Samsung", test: (name, brand) => brand === "Samsung" && /Book Cover Keyboard/i.test(name), groupHref: "/catalog?category=planshety&brand=Samsung&q=Book%20Cover%20Keyboard", directListing: true },
    { label: "Xiaomi Pad", test: (_name, brand) => brand === "Xiaomi", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("Xiaomi")}` },
    { label: "HUAWEI MatePad", test: (_name, brand) => brand === "HUAWEI", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("HUAWEI")}` },
    { label: "HONOR Pad", test: (_name, brand) => brand === "HONOR", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("HONOR")}` },
    { label: "OnePlus Pad", test: (_name, brand) => brand === "OnePlus", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("OnePlus")}` },
  ],
  chasy: [
    { label: "Apple Watch", test: (_name, brand) => brand === "Apple", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("Apple")}`, order: MODEL_DISPLAY_ORDER.watch },
    { label: "Samsung Galaxy Watch", test: (_name, brand) => brand === "Samsung", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("Samsung")}`, order: MODEL_DISPLAY_ORDER.samsungWatches },
    { label: "HUAWEI Watch", test: (_name, brand) => brand === "HUAWEI", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("HUAWEI")}` },
    { label: "OnePlus Watch", test: (_name, brand) => brand === "OnePlus", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("OnePlus")}` },
  ],
  "igrovye-pristavki": [
    { label: "PlayStation 5", test: (_name, brand) => brand === "Sony PlayStation", groupHref: "/catalog?category=igrovye-pristavki&brand=Sony%20PlayStation", order: MODEL_DISPLAY_ORDER.gameConsoles },
    { label: "Nintendo Switch", test: (_name, brand) => brand === "Nintendo", groupHref: "/catalog?category=igrovye-pristavki&brand=Nintendo", order: MODEL_DISPLAY_ORDER.gameConsoles },
    { label: "Xbox", test: (_name, brand) => brand === "Xbox", groupHref: "/catalog?category=igrovye-pristavki&brand=Xbox", order: MODEL_DISPLAY_ORDER.gameConsoles },
    { label: "Valve Steam Machine", test: (_name, brand) => brand === "Valve", groupHref: "/catalog?category=igrovye-pristavki&brand=Valve", order: MODEL_DISPLAY_ORDER.gameConsoles },
  ],
  "portativnye-konsoli": [
    { label: "PlayStation Portal", test: (_name, brand) => brand === "Sony PlayStation", groupHref: "/catalog?category=portativnye-konsoli&brand=Sony%20PlayStation", order: MODEL_DISPLAY_ORDER.portableConsoles },
    { label: "Nintendo Switch Lite", test: (_name, brand) => brand === "Nintendo", groupHref: "/catalog?category=portativnye-konsoli&brand=Nintendo", order: MODEL_DISPLAY_ORDER.portableConsoles },
    { label: "ASUS ROG Ally", test: (_name, brand) => brand === "ASUS ROG", groupHref: "/catalog?category=portativnye-konsoli&brand=ASUS%20ROG", order: MODEL_DISPLAY_ORDER.portableConsoles },
    { label: "Lenovo Legion Go", test: (_name, brand) => brand === "Lenovo", groupHref: "/catalog?category=portativnye-konsoli&brand=Lenovo", order: MODEL_DISPLAY_ORDER.portableConsoles },
    { label: "Steam Deck", test: (_name, brand) => brand === "Valve", groupHref: "/catalog?category=portativnye-konsoli&brand=Valve", order: MODEL_DISPLAY_ORDER.portableConsoles },
  ],
  "igrovye-aksessuary": [
    { label: "Контроллеры PlayStation", test: (name) => /dualsense|victrix/i.test(name), groupHref: "/catalog?category=igrovye-aksessuary", order: MODEL_DISPLAY_ORDER.gamingAccessories },
    { label: "Аксессуары PS5", test: (name) => /подставка|зарядная станция|дисковод/i.test(name), groupHref: "/catalog?category=igrovye-aksessuary&brand=Sony%20PlayStation", order: MODEL_DISPLAY_ORDER.gamingAccessories },
    { label: "Гоночные аксессуары Logitech", test: (_name, brand) => brand === "Logitech G", groupHref: "/catalog?category=igrovye-aksessuary&brand=Logitech%20G", order: MODEL_DISPLAY_ORDER.gamingAccessories },
    { label: "Steam Deck", test: (_name, brand) => brand === "Valve", groupHref: "/catalog?category=igrovye-aksessuary&brand=Valve", order: MODEL_DISPLAY_ORDER.gamingAccessories },
  ],
  naushniki: [
    { label: "Наушники AirPods", test: (name) => /airpods|earpods/i.test(name), groupHref: "/catalog?category=naushniki&brand=Apple", order: MODEL_DISPLAY_ORDER.airpods },
    { label: "Игровые гарнитуры PlayStation", test: (_name, brand) => brand === "Sony PlayStation", groupHref: "/catalog?category=naushniki&brand=Sony%20PlayStation", order: MODEL_DISPLAY_ORDER.headphones },
    { label: "Marshall", test: (_name, brand) => brand === "Marshall", groupHref: "/catalog?category=naushniki&brand=Marshall", order: MODEL_DISPLAY_ORDER.headphones },
  ],
};

// Категории без деления на линейки (один бренд на категорию) — тут просто
// сортируем весь список товаров по тому же принципу "новые сверху".
const CATEGORY_ORDER: Record<string, readonly string[]> = {
  chasy: MODEL_DISPLAY_ORDER.watch,
  planshety: MODEL_DISPLAY_ORDER.ipad,
  noutbuki: MODEL_DISPLAY_ORDER.macbook,
  naushniki: MODEL_DISPLAY_ORDER.headphones,
  "ekshn-kamery": MODEL_DISPLAY_ORDER.gopro,
  "smart-ochki": MODEL_DISPLAY_ORDER.smartGlasses,
  "igrovye-pristavki": MODEL_DISPLAY_ORDER.gameConsoles,
  "portativnye-konsoli": MODEL_DISPLAY_ORDER.portableConsoles,
  "vr-garnitury": MODEL_DISPLAY_ORDER.vrHeadsets,
  "igrovye-aksessuary": MODEL_DISPLAY_ORDER.gamingAccessories,
  "fitnes-braslety": MODEL_DISPLAY_ORDER.fitness,
  "portativnaya-akustika": MODEL_DISPLAY_ORDER.portableAudio,
};

// Шапка отображается на каждой странице. Без кэша её запрос к БД выполнялся
// при каждом открытии, хотя структура категорий меняется редко. Храним
// дерево одну минуту: меню открывается быстрее, а после обновления прайса
// посетитель увидит актуальную структуру максимум через минуту.
export const getCatalogNavTree = unstable_cache(async (): Promise<CatalogNavNode[]> => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { status: "PUBLISHED" },
        select: { name: true, slug: true, brand: true },
        orderBy: { name: "asc" },
      },
    },
  });

  const tree: CatalogNavNode[] = [];

  for (const category of categories) {
    if (category.products.length === 0) continue;

    // Одна модель в категории — сразу ведём на страницу товара, без меню.
    if (category.products.length === 1) {
      tree.push({
        label: category.name,
        href: `/product/${category.products[0].slug}`,
      });
      continue;
    }

    const matchers = LINE_MATCHERS[category.slug];
    if (matchers && matchers.length > 1) {
      const groups: CatalogNavNode[] = [];
      const matchedSlugs = new Set<string>();

      for (const matcher of matchers) {
        const matchedProducts = category.products
          .filter((p) => matcher.test(p.name, p.brand))
          // Новые модели сверху — для линеек без заданного порядка
          // сортировка ничего не меняет, они остаются в прежнем порядке
          // (по имени).
          .slice()
          .sort((a, b) => rankInList(matcher.order, a.name) - rankInList(matcher.order, b.name));
        for (const product of matchedProducts) matchedSlugs.add(product.slug);
        const items = matchedProducts.map((product) => ({
          label: product.name,
          href: `/product/${product.slug}`,
        }));
        if (items.length > 0) {
          if (matcher.directListing) {
            groups.push({ label: matcher.label, href: matcher.groupHref });
            continue;
          }
          if (matcher.buildChildren) {
            const children = matcher.buildChildren(matchedProducts);
            if (children.length > 0) {
              groups.push({ label: matcher.label, href: matcher.groupHref, children });
            }
            continue;
          }
          // Neo and other single-model lines open the complete variant grid,
          // without a search-results card or an extra desktop/mobile submenu.
          const node = modelLineMenuNode(matcher.label, items, matcher.groupHref);
          if (node) groups.push(node);
        }
      }

      // Товары, не попавшие ни под один паттерн — не теряем, добавляем плоско.
      for (const p of category.products) {
        if (!matchedSlugs.has(p.slug)) {
          groups.push({ label: p.name, href: `/product/${p.slug}` });
        }
      }

      tree.push({
        label: category.name,
        href: `/catalog?category=${category.slug}`,
        children: groups,
      });
      continue;
    }

    const order = CATEGORY_ORDER[category.slug];
    const orderedProducts = order
      ? [...category.products].sort((a, b) => rankInList(order, a.name) - rankInList(order, b.name))
      : category.products;

    tree.push({
      label: category.name,
      href: `/catalog?category=${category.slug}`,
      children: orderedProducts.map((p) => ({
        label: p.name,
        href: `/product/${p.slug}`,
      })),
    });
  }

  return tree;
}, ["ijoy-catalog-nav-tree"], { revalidate: 60, tags: ["catalog-nav"] });

export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: { where: { status: "PUBLISHED" } } },
      },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    productCount: c._count.products,
  }));
}

export type CatalogFilters = {
  categorySlug?: string;
  brand?: string[];
  productSlug?: string[];
  memory?: string[];
  color?: string[];
  region?: string[];
  onlyInStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  // Поиск по названию/бренду товара (шапка сайта, форма без JS на /catalog).
  search?: string;
};

export async function getPublishedProducts(filters: CatalogFilters = {}) {
  // Ignore obsolete regional URLs when browsing Samsung phones only.
  const samsungOnly = filters.productSlug?.length
    ? filters.productSlug.every(isSamsungPhone)
    : filters.categorySlug === "telefony" && filters.brand?.length === 1 && filters.brand[0] === "Samsung";
  const selectedRegions = samsungOnly ? undefined : filters.region;
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
  };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.brand?.length) {
    where.brand = { in: filters.brand };
  }

  if (filters.productSlug?.length) {
    where.slug = { in: filters.productSlug };
  }

  const variantWhere: Prisma.ProductVariantWhereInput = {};
  if (filters.minPrice != null || filters.maxPrice != null) {
    variantWhere.price = { gte: filters.minPrice, lte: filters.maxPrice };
  }
  if (filters.memory?.length) variantWhere.memory = { in: filters.memory };
  if (filters.color?.length) variantWhere.color = { in: filters.color };
  if (selectedRegions?.length) variantWhere.region = { in: selectedRegions };
  if (filters.onlyInStock) variantWhere.inStock = true;

  if (Object.keys(variantWhere).length > 0) {
    where.variants = { some: variantWhere };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Признанные модели (iPhone, Samsung Galaxy, iPad, MacBook, Apple Watch,
  // AirPods) идут по актуальности (новые сверху); остальные товары
  // сохраняют прежний порядок (по дате добавления) — сортировка стабильная,
  // так что относительный порядок среди них не меняется, они просто уходят
  // вниз списка.
  const sorted = [...products].sort((a, b) => {
    const rankA = rankInList(resolveOrderList(a.category.slug, a.brand, a.name), a.name);
    const rankB = rankInList(resolveOrderList(b.category.slug, b.brand, b.name), b.name);
    return rankA - rankB;
  });

  return sorted.flatMap((product) => {
    const visibleVariants = Object.keys(variantWhere).length > 0
      ? product.variants.filter((variant) => {
          if (filters.minPrice != null && (variant.price === null || Number(variant.price) < filters.minPrice)) return false;
          if (filters.maxPrice != null && (variant.price === null || Number(variant.price) > filters.maxPrice)) return false;
          if (filters.memory?.length && (!variant.memory || !filters.memory.includes(variant.memory))) return false;
          if (filters.color?.length && (!variant.color || !filters.color.includes(variant.color))) return false;
          if (selectedRegions?.length && (!variant.region || !selectedRegions.includes(variant.region))) return false;
          if (filters.onlyInStock && !variant.inStock) return false;
          return true;
        })
      : product.variants;
    if (isIpadKeyboard(product.slug)) {
      return [...visibleVariants].sort((a, b) => (a.color === "White" ? 0 : 1) - (b.color === "White" ? 0 : 1)).map(variant => ({
        ...toProductSummary(product, [variant]),
        id: `${product.id}:${variant.id}`,
        name: `${product.name} · ${colorLabel(variant.color)}`,
        cardVariantId: variant.id,
        exactPrice: true,
      }));
    }
    return [toProductSummary(product, visibleVariants)];
  });
}

export async function getCatalogFilterOptions(filters: Pick<CatalogFilters, "categorySlug" | "brand" | "productSlug"> = {}) {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.brand?.length) where.brand = { in: filters.brand };
  if (filters.productSlug?.length) where.slug = { in: filters.productSlug };

  const products = await prisma.product.findMany({
    where,
    select: {
      name: true,
      slug: true,
      variants: { select: { memory: true, color: true, region: true } },
    },
    orderBy: { name: "asc" },
  });

  const unique = (values: (string | null)[]) => [...new Set(values.filter((value): value is string => Boolean(value)))];
  const memory = unique(products.flatMap((product) => product.variants.map((variant) => variant.memory))).sort((a, b) => {
    const number = (value: string) => {
      const match = value.match(/^(\d+(?:\.\d+)?)\s*(GB|TB)?/i);
      if (!match) return Number.MAX_SAFE_INTEGER;
      return Number(match[1]) * (match[2]?.toUpperCase() === "TB" ? 1000 : 1);
    };
    return number(a) - number(b);
  });

  return {
    products,
    memory,
    colors: unique(products.flatMap((product) => product.variants.map((variant) => variant.color))).sort(),
    regions: unique(products.filter(product => !isSamsungPhone(product.slug)).flatMap((product) => product.variants.map((variant) => variant.region))).sort(),
  };
}

export async function getDistinctBrands(categorySlug?: string) {
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    brand: { not: null },
  };
  if (categorySlug) where.category = { slug: categorySlug };

  const rows = await prisma.product.findMany({
    where,
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand).filter((b): b is string => Boolean(b));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: {
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product || product.status !== "PUBLISHED") {
    return null;
  }

  const offers = product.variants.map(v => ({ id: v.id, memory: v.memory, color: v.color, region: v.region, price: v.price !== null ? Number(v.price) : null, inStock: v.inStock }));
  const presentation = isSamsungPhone(slug) ? samsungMemoryColorGrid(offers) : { variants: offers, aliases: {} as Record<string, string> };

  return {
    ...toProductSummary(product),
    description: product.description,
    images: product.images,
    colorImages: (product.colorImages as Record<string, string[]> | null) ?? null,
    // Характеристики/особенности/сравнение с предыдущим поколением —
    // пока заполнены точечно (пилот iPhone 17 Pro Max, см. prisma/seed.ts),
    // у остальных товаров эти поля пустые и блок на странице не показывается.
    specs: (product.specs as Record<string, string> | null) ?? null,
    highlights: product.highlights,
    previousGenLabel: product.previousGenLabel,
    previousGenHighlights: product.previousGenHighlights,
    variants: presentation.variants,
    variantAliases: presentation.aliases,
  };
}

export type CompareModel = {
  slug: string;
  name: string;
  minPrice: number | null;
  hasStock: boolean;
  colors: string[];
  images: string[];
  colorImages: Record<string, string[]> | null;
  specs: Record<string, string> | null;
};

// Линейка iPhone для страницы /compare — только модели, которые реально
// сейчас есть в продаже (актуальный прайс из БД), в порядке "новые сверху"
// (тот же MODEL_DISPLAY_ORDER.iphone, что и в каталоге/меню). Характеристики
// (specs) берутся из того же поля Product.specs, что и на странице товара —
// ключи в нём приведены к единому виду (см. prisma/seed.ts,
// IPHONE_CONTENT_OVERRIDES), поэтому строки таблицы сравнения совпадают
// между моделями там, где данные реально есть.
export async function getDeviceCompareLineup(): Promise<CompareModel[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { category: { slug: "telefony" } },
        { category: { slug: "planshety" }, brand: "Apple", slug: { startsWith: "ipad-" } },
        { category: { slug: "planshety" }, brand: "Samsung", slug: { startsWith: "samsung-galaxy-tab-" } },
      ],
    },
    include: { variants: true, category: true },
  });

  const sorted = [...products].sort((a, b) => {
    const familyA = /^iphone/i.test(a.name) ? 0 : 1;
    const familyB = /^iphone/i.test(b.name) ? 0 : 1;
    if (familyA !== familyB) return familyA - familyB;
    const order = familyA === 0 ? MODEL_DISPLAY_ORDER.iphone : MODEL_DISPLAY_ORDER.ipad;
    return rankInList(order, a.name) - rankInList(order, b.name);
  });

  return sorted.map((product) => {
    const priced = product.variants.filter((v) => v.price !== null);
    const prices = priced.map((v) => Number(v.price));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const hasStock = product.variants.some((v) => v.inStock);
    const colors = [...new Set(product.variants.map((v) => v.color).filter((c): c is string => Boolean(c)))];

    return {
      slug: product.slug,
      name: product.name,
      minPrice,
      hasStock,
      colors,
      images: product.images,
      colorImages: (product.colorImages as Record<string, string[]> | null) ?? null,
      specs: (product.specs as Record<string, string> | null) ?? null,
    };
  });
}

// Обратная совместимость для существующих импортов.
export const getIphoneCompareLineup = getDeviceCompareLineup;

// Товары по списку слагов — оставлено на случай, если понадобится подборка
// товаров целиком по слагам (сейчас /favorites работает через
// getFavoriteVariants ниже, т.к. избранное — по конкретным модификациям).
export async function getProductsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, status: "PUBLISHED" },
    include: {
      category: true,
      variants: true,
    },
  });

  const bySlug = new Map(products.map((p) => [p.slug, toProductSummary(p)]));
  // Сохраняем порядок, в котором слаги пришли (порядок добавления в избранное).
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

// Избранные модификации по их id (localStorage хранит id ProductVariant, а
// не слаги товаров — избранное привязано к конкретной памяти/цвету/региону,
// см. src/lib/favorites.ts) — для страницы /favorites.
export async function getFavoriteVariants(variantIds: string[]) {
  if (variantIds.length === 0) return [];

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    include: { product: true },
  });

  const byId = new Map(
    variants
      .filter((v) => v.product.status === "PUBLISHED")
      .map((v) => [
        v.id,
        {
          variantId: v.id,
          memory: v.memory,
          color: v.color,
          region: isSamsungPhone(v.product.slug) ? null : v.region,
          price: v.price !== null ? Number(v.price) : null,
          inStock: v.inStock,
          productSlug: v.product.slug,
          productName: v.product.name,
          brand: v.product.brand,
          imageUrl: pickCoverImage(
            v.product.images,
            (v.product.colorImages as Record<string, string[]> | null) ?? null,
            v.color,
          ),
        },
      ]),
  );

  // Сохраняем порядок, в котором id пришли (порядок добавления в избранное).
  return variantIds
    .map((id) => byId.get(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
}

// pickCoverImage переехала в отдельный файл без серверных зависимостей (см.
// pickCoverImage.ts) — реэкспортируем её отсюда же, чтобы все существующие
// импорты `from "@/lib/catalog"` продолжали работать без изменений.
export { pickCoverImage } from "@/lib/pickCoverImage";

function toProductSummary(
  product: Prisma.ProductGetPayload<{
    include: { category: true; variants: true };
  }>,
  variants = product.variants,
) {
  // Модификации с ценой "уточняйте у менеджера" (price: null) не участвуют
  // в подсчёте минимальной цены на карточке товара.
  const priced = variants.filter((v) => v.price !== null);
  const prices = priced.map((v) => Number(v.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasStock = variants.some((v) => v.inStock);

  // "Представительская" модификация карточки товара (сетка каталога/Новинки)
  // — самая дешёвая (та же, что определяет minPrice выше), либо просто
  // первая, если цены нет ни у одной. Именно её id получает сердечко
  // избранного на карточке товара, где нет собственного выбора модификации.
  const cheapest =
    priced.length > 0
      ? priced.reduce((min, v) => (Number(v.price) < Number(min.price) ? v : min))
      : variants[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    minPrice,
    hasStock,
    variantCount: variants.length,
    defaultVariantId: cheapest?.id ?? null,
    cardVariantId: null as string | null,
    exactPrice: false,
    coverImage: pickVariantImages(
      product.images,
      (product.colorImages as Record<string, string[]> | null) ?? null,
      cheapest,
    )[0] ?? null,
  };
}
