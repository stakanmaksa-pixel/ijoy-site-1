// Каталог моделей без цен. Источники на 01.09.2026: официальные страницы
// производителей. Эти записи не заменяют прайс поставщика: у каждой
// модификации price: null, поэтому на витрине выводится «Уточняйте цену».

export type OfficialCatalogEntry = {
  category: "telefony" | "chasy" | "planshety" | "noutbuki" | "ekshn-kamery";
  name: string;
  slug: string;
  brand: string;
  description: string;
  memories?: string[];
  colors: string[];
};

// Категории, которых могло не быть в первоначальной базе. Импортёр создаёт
// только отсутствующие: название и порядок существующих категорий он не меняет.
export const OFFICIAL_CATALOG_CATEGORIES = [
  { slug: "ekshn-kamery", name: "Экшн-камеры", sortOrder: 50 },
] as const;

export type OfficialVariant = {
  memory: string | null;
  color: string | null;
  region: null;
  price: null;
  inStock: boolean;
  rawLabel: string;
};

export function officialVariants(entry: OfficialCatalogEntry): OfficialVariant[] {
  const memories = entry.memories?.length ? entry.memories : [null];
  const colors = entry.colors.length ? entry.colors : [null];
  return memories.flatMap((memory) =>
    colors.map((color) => ({
      memory,
      color,
      region: null,
      price: null,
      // true нужен, чтобы посетитель мог отправить заявку на товар без
      // известной цены. Наличие всё равно подтверждает менеджер.
      inStock: true,
      rawLabel: `${entry.name}${memory ? ` ${memory}` : ""}${color ? ` ${color}` : ""} — уточнить у менеджера`,
    })),
  );
}

// Первая выверенная партия. Модели, которые уже есть в прайсе, намеренно
// не перечислены: скрипт никогда не меняет существующий товар.
export const OFFICIAL_CATALOG_ENTRIES: OfficialCatalogEntry[] = [
  // Apple iPhone 13–14: недостающие Pro/mini версии.
  {
    category: "telefony", name: "iPhone 13 mini", slug: "iphone-13-mini", brand: "Apple",
    description: "Компактный iPhone 13 mini. Цену и доступность подтвердит менеджер.",
    memories: ["128GB", "256GB", "512GB"],
    colors: ["Green", "Pink", "Blue", "Midnight", "Starlight", "(PRODUCT)RED"],
  },
  {
    category: "telefony", name: "iPhone 13 Pro", slug: "iphone-13-pro", brand: "Apple",
    description: "iPhone 13 Pro. Цену и доступность подтвердит менеджер.",
    memories: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Alpine Green", "Sierra Blue", "Silver", "Gold", "Graphite"],
  },
  {
    category: "telefony", name: "iPhone 13 Pro Max", slug: "iphone-13-pro-max", brand: "Apple",
    description: "iPhone 13 Pro Max. Цену и доступность подтвердит менеджер.",
    memories: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Alpine Green", "Sierra Blue", "Silver", "Gold", "Graphite"],
  },
  {
    category: "telefony", name: "iPhone 14 Pro", slug: "iphone-14-pro", brand: "Apple",
    description: "iPhone 14 Pro. Цену и доступность подтвердит менеджер.",
    memories: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"],
  },
  {
    category: "telefony", name: "iPhone 14 Pro Max", slug: "iphone-14-pro-max", brand: "Apple",
    description: "iPhone 14 Pro Max. Цену и доступность подтвердит менеджер.",
    memories: ["128GB", "256GB", "512GB", "1TB"],
    colors: ["Space Black", "Silver", "Gold", "Deep Purple"],
  },

  // Samsung Galaxy S23–S25, отсутствующие в текущем прайсовом каталоге.
  {
    category: "telefony", name: "Samsung Galaxy S23", slug: "samsung-galaxy-s23", brand: "Samsung",
    description: "Samsung Galaxy S23. Цену и доступность подтвердит менеджер.",
    memories: ["8/128GB", "8/256GB"],
    colors: ["Phantom Black", "Cream", "Green", "Lavender"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S23 Ultra", slug: "samsung-galaxy-s23-ultra", brand: "Samsung",
    description: "Samsung Galaxy S23 Ultra. Цену и доступность подтвердит менеджер.",
    memories: ["8/256GB", "12/256GB", "12/512GB", "12/1TB"],
    colors: ["Phantom Black", "Cream", "Green", "Lavender"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S23 FE", slug: "samsung-galaxy-s23-fe", brand: "Samsung",
    description: "Samsung Galaxy S23 FE. Цену и доступность подтвердит менеджер.",
    memories: ["8/128GB", "8/256GB"],
    colors: ["Graphite", "Cream", "Mint", "Purple"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S24", slug: "samsung-galaxy-s24", brand: "Samsung",
    description: "Samsung Galaxy S24. Цену и доступность подтвердит менеджер.",
    memories: ["8/128GB", "8/256GB"],
    colors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S24+", slug: "samsung-galaxy-s24-plus", brand: "Samsung",
    description: "Samsung Galaxy S24+. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB"],
    colors: ["Onyx Black", "Marble Gray", "Cobalt Violet", "Amber Yellow"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S24 Ultra", slug: "samsung-galaxy-s24-ultra", brand: "Samsung",
    description: "Samsung Galaxy S24 Ultra. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB", "12/1TB"],
    colors: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S24 FE", slug: "samsung-galaxy-s24-fe", brand: "Samsung",
    description: "Samsung Galaxy S24 FE. Цену и доступность подтвердит менеджер.",
    memories: ["8/128GB", "8/256GB"],
    colors: ["Blue", "Graphite", "Mint", "Yellow"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S25+", slug: "samsung-galaxy-s25-plus", brand: "Samsung",
    description: "Samsung Galaxy S25+. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB"],
    colors: ["Navy", "Icy Blue", "Mint", "Silver Shadow"],
  },
  {
    category: "telefony", name: "Samsung Galaxy S25 Edge", slug: "samsung-galaxy-s25-edge", brand: "Samsung",
    description: "Samsung Galaxy S25 Edge. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB"],
    colors: ["Titanium Icyblue", "Titanium Silver", "Titanium Jetblack"],
  },

  // Часы и планшеты Samsung — без цены, чтобы посетитель мог оставить заявку.
  { category: "chasy", name: "Samsung Galaxy Watch7", slug: "samsung-galaxy-watch7", brand: "Samsung", description: "Samsung Galaxy Watch7. Цену и доступность подтвердит менеджер.", colors: ["Green", "Cream", "Silver"] },
  { category: "chasy", name: "Samsung Galaxy Watch8", slug: "samsung-galaxy-watch8", brand: "Samsung", description: "Samsung Galaxy Watch8. Цену и доступность подтвердит менеджер.", colors: ["Graphite", "Silver"] },
  { category: "chasy", name: "Samsung Galaxy Watch Ultra", slug: "samsung-galaxy-watch-ultra", brand: "Samsung", description: "Samsung Galaxy Watch Ultra. Цену и доступность подтвердит менеджер.", colors: ["Titanium Gray", "Titanium White", "Titanium Silver"] },
  { category: "planshety", name: "Samsung Galaxy Tab S9", slug: "samsung-galaxy-tab-s9", brand: "Samsung", description: "Samsung Galaxy Tab S9. Цену и доступность подтвердит менеджер.", memories: ["8/128GB", "12/256GB"], colors: ["Graphite", "Beige"] },
  { category: "planshety", name: "Samsung Galaxy Tab S9+", slug: "samsung-galaxy-tab-s9-plus", brand: "Samsung", description: "Samsung Galaxy Tab S9+. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB"], colors: ["Graphite", "Beige"] },
  { category: "planshety", name: "Samsung Galaxy Tab S9 Ultra", slug: "samsung-galaxy-tab-s9-ultra", brand: "Samsung", description: "Samsung Galaxy Tab S9 Ultra. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB", "16/1TB"], colors: ["Graphite", "Beige"] },
  { category: "planshety", name: "Samsung Galaxy Tab S10+", slug: "samsung-galaxy-tab-s10-plus", brand: "Samsung", description: "Samsung Galaxy Tab S10+. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB"], colors: ["Moonstone Gray", "Platinum Silver"] },
  { category: "planshety", name: "Samsung Galaxy Tab S10 Ultra", slug: "samsung-galaxy-tab-s10-ultra", brand: "Samsung", description: "Samsung Galaxy Tab S10 Ultra. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB", "16/1TB"], colors: ["Moonstone Gray", "Platinum Silver"] },
  { category: "planshety", name: "Samsung Galaxy Tab S11", slug: "samsung-galaxy-tab-s11", brand: "Samsung", description: "Samsung Galaxy Tab S11. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB"], colors: ["Gray", "Silver"] },
  { category: "planshety", name: "Samsung Galaxy Tab S11 Ultra", slug: "samsung-galaxy-tab-s11-ultra", brand: "Samsung", description: "Samsung Galaxy Tab S11 Ultra. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB", "16/1TB"], colors: ["Gray", "Silver"] },

  // Xiaomi 15T — актуальная T-серия. Варианты подтверждены на официальных
  // страницах Xiaomi; наличие в России в любом случае уточняет менеджер.
  {
    category: "telefony", name: "Xiaomi 15T", slug: "xiaomi-15t", brand: "Xiaomi",
    description: "Xiaomi 15T с камерой Leica. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB"],
    colors: ["Black", "Gray", "Rose Gold"],
  },
  {
    category: "telefony", name: "Xiaomi 15T Pro", slug: "xiaomi-15t-pro", brand: "Xiaomi",
    description: "Xiaomi 15T Pro с камерой Leica и 5× телеобъективом. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB", "12/1TB"],
    colors: ["Black", "Gray", "Mocha Gold"],
  },

  // OnePlus — актуальные флагманы. Конфигурации и цвета сверены с OnePlus.
  {
    category: "telefony", name: "OnePlus 13", slug: "oneplus-13", brand: "OnePlus",
    description: "OnePlus 13. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "16/512GB"],
    colors: ["Midnight Ocean", "Arctic Dawn", "Black Eclipse"],
  },
  {
    category: "telefony", name: "OnePlus 15", slug: "oneplus-15", brand: "OnePlus",
    description: "OnePlus 15. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "16/512GB"],
    colors: ["Sand Storm", "Infinite Black", "Ultra Violet"],
  },

  // В разных странах HONOR поставляет не все цвета, поэтому перечислены
  // официально заявленные глобальные варианты. Конкретный регион уточняет менеджер.
  {
    category: "telefony", name: "HONOR Magic8 Pro", slug: "honor-magic8-pro", brand: "HONOR",
    description: "HONOR Magic8 Pro. Цену, регион поставки и доступность подтвердит менеджер.",
    memories: ["12/512GB", "16/1TB"],
    colors: ["Sunrise Gold", "Sky Cyan", "Black", "Dawn Gold", "Reddish Brown", "Ivory White"],
  },

  {
    category: "telefony", name: "POCO F8 Pro", slug: "poco-f8-pro", brand: "POCO",
    description: "POCO F8 Pro. Цену и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB"],
    colors: ["Black", "Blue", "Titanium Silver"],
  },

  {
    category: "telefony", name: "Redmi Note 14", slug: "redmi-note-14", brand: "Xiaomi",
    description: "Redmi Note 14. Цену и доступность подтвердит менеджер.",
    memories: ["6/128GB", "6/256GB", "8/128GB", "8/256GB", "8/512GB"],
    colors: ["Purple", "Green", "Black", "Blue"],
  },

  {
    category: "telefony", name: "HUAWEI Pura 80", slug: "huawei-pura-80", brand: "HUAWEI",
    description: "HUAWEI Pura 80. Цену, регион поставки и доступность подтвердит менеджер.",
    memories: ["12/256GB", "12/512GB", "12/1TB"],
    colors: ["Velvet Gold", "Velvet Green", "Velvet White", "Velvet Black"],
  },

  // Актуальные iPad и Apple Watch. Конфигурации взяты из Apple Compare.
  { category: "planshety", name: "iPad Pro 11-inch (M5)", slug: "ipad-pro-11-m5", brand: "Apple", description: "iPad Pro 11-inch с чипом M5. Цену и доступность подтвердит менеджер.", memories: ["256GB", "512GB", "1TB", "2TB"], colors: ["Space Black", "Silver"] },
  { category: "planshety", name: "iPad Pro 13-inch (M5)", slug: "ipad-pro-13-m5", brand: "Apple", description: "iPad Pro 13-inch с чипом M5. Цену и доступность подтвердит менеджер.", memories: ["256GB", "512GB", "1TB", "2TB"], colors: ["Space Black", "Silver"] },
  { category: "planshety", name: "iPad Air 11-inch (M3)", slug: "ipad-air-11-m3", brand: "Apple", description: "iPad Air 11-inch с чипом M3. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB", "1TB"], colors: ["Space Gray", "Blue", "Purple", "Starlight"] },
  { category: "planshety", name: "iPad Air 13-inch (M3)", slug: "ipad-air-13-m3", brand: "Apple", description: "iPad Air 13-inch с чипом M3. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB", "1TB"], colors: ["Space Gray", "Blue", "Purple", "Starlight"] },
  { category: "chasy", name: "Apple Watch Ultra 3", slug: "apple-watch-ultra-3", brand: "Apple", description: "Apple Watch Ultra 3, корпус 49 мм. Цену и доступность подтвердит менеджер.", memories: ["64GB"], colors: ["Natural Titanium", "Black Titanium"] },

  // Ноутбуки Apple добавляются в уже существующую категорию «Ноутбуки».
  { category: "noutbuki", name: "MacBook Neo 13-inch", slug: "macbook-neo-13", brand: "Apple", description: "MacBook Neo 13-inch с чипом A18 Pro. Цену и доступность подтвердит менеджер.", memories: ["8GB / 256GB SSD", "8GB / 512GB SSD"], colors: ["Silver", "Blush", "Citrus", "Indigo"] },
  { category: "noutbuki", name: "MacBook Air 13-inch (M4)", slug: "macbook-air-13-m4", brand: "Apple", description: "MacBook Air 13-inch с чипом M4. Цену и доступность подтвердит менеджер.", memories: ["16GB / 256GB SSD", "16GB / 512GB SSD", "16GB / 1TB SSD", "16GB / 2TB SSD", "24GB / 512GB SSD", "32GB / 2TB SSD"], colors: ["Sky Blue", "Silver", "Starlight", "Midnight"] },
  { category: "noutbuki", name: "MacBook Air 15-inch (M4)", slug: "macbook-air-15-m4", brand: "Apple", description: "MacBook Air 15-inch с чипом M4. Цену и доступность подтвердит менеджер.", memories: ["16GB / 256GB SSD", "16GB / 512GB SSD", "16GB / 1TB SSD", "16GB / 2TB SSD", "24GB / 512GB SSD", "32GB / 2TB SSD"], colors: ["Sky Blue", "Silver", "Starlight", "Midnight"] },
  { category: "noutbuki", name: "MacBook Pro 14-inch (M5)", slug: "macbook-pro-14-m5", brand: "Apple", description: "MacBook Pro 14-inch с чипами M5, M5 Pro или M5 Max. Цену и доступность подтвердит менеджер.", memories: ["16GB / 1TB SSD", "24GB / 1TB SSD", "32GB / 1TB SSD", "48GB / 2TB SSD", "64GB / 4TB SSD", "128GB / 8TB SSD"], colors: ["Space Black", "Silver"] },
  { category: "noutbuki", name: "MacBook Pro 16-inch (M5)", slug: "macbook-pro-16-m5", brand: "Apple", description: "MacBook Pro 16-inch с чипами M5 Pro или M5 Max. Цену и доступность подтвердит менеджер.", memories: ["24GB / 1TB SSD", "36GB / 1TB SSD", "48GB / 2TB SSD", "64GB / 4TB SSD", "128GB / 8TB SSD"], colors: ["Space Black", "Silver"] },

  // Samsung: текущая S26-линейка и складной Fold8. Импорт не перезапишет
  // товары, если они уже пришли из прайса с реальными ценами.
  { category: "telefony", name: "Samsung Galaxy S26", slug: "samsung-galaxy-s26", brand: "Samsung", description: "Samsung Galaxy S26. Цену и доступность подтвердит менеджер.", memories: ["256GB", "512GB"], colors: ["Cobalt Violet", "Sky Blue", "Black", "White", "Silver Shadow", "Pink Gold"] },
  { category: "telefony", name: "Samsung Galaxy S26+", slug: "samsung-galaxy-s26-plus", brand: "Samsung", description: "Samsung Galaxy S26+. Цену и доступность подтвердит менеджер.", memories: ["256GB", "512GB"], colors: ["Cobalt Violet", "Sky Blue", "Black", "White", "Silver Shadow", "Pink Gold"] },
  { category: "telefony", name: "Samsung Galaxy S26 Ultra", slug: "samsung-galaxy-s26-ultra", brand: "Samsung", description: "Samsung Galaxy S26 Ultra. Цену и доступность подтвердит менеджер.", memories: ["256GB", "512GB", "1TB"], colors: ["Cobalt Violet", "Sky Blue", "Black", "White", "Silver Shadow", "Pink Gold"] },
  { category: "telefony", name: "Samsung Galaxy Z Fold8", slug: "samsung-galaxy-z-fold8", brand: "Samsung", description: "Samsung Galaxy Z Fold8. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB", "16/1TB"], colors: ["Lavender", "Graphite", "Cream", "Pistachio"] },
  { category: "telefony", name: "Samsung Galaxy Z Flip8", slug: "samsung-galaxy-z-flip8", brand: "Samsung", description: "Samsung Galaxy Z Flip8. Цену и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB"], colors: ["Pink", "Graphite", "Cream", "Mint"] },
  { category: "telefony", name: "Xiaomi 15 Ultra", slug: "xiaomi-15-ultra", brand: "Xiaomi", description: "Xiaomi 15 Ultra с камерой Leica. Цену и доступность подтвердит менеджер.", memories: ["16/512GB", "16/1TB"], colors: ["Black", "White", "Silver Chrome"] },
  { category: "chasy", name: "Apple Watch Series 11", slug: "apple-watch-series-11", brand: "Apple", description: "Apple Watch Series 11. Цену и доступность подтвердит менеджер.", memories: ["64GB"], colors: ["Rose Gold", "Silver", "Space Gray", "Jet Black", "Gold Titanium", "Natural Titanium", "Slate Titanium"] },
  { category: "chasy", name: "Apple Watch SE 3", slug: "apple-watch-se-3", brand: "Apple", description: "Apple Watch SE 3. Цену и доступность подтвердит менеджер.", memories: ["64GB"], colors: ["Starlight", "Midnight"] },
  { category: "telefony", name: "POCO X7 Pro", slug: "poco-x7-pro", brand: "POCO", description: "POCO X7 Pro. Цену и доступность подтвердит менеджер.", memories: ["8/256GB", "12/256GB", "12/512GB"], colors: ["Black", "Green", "Yellow"] },
  { category: "telefony", name: "HUAWEI Mate X7", slug: "huawei-mate-x7", brand: "HUAWEI", description: "HUAWEI Mate X7. Цену, регион поставки и доступность подтвердит менеджер.", memories: ["12/256GB", "12/512GB", "16/512GB", "16/1TB", "20/1TB"], colors: ["Cloud Brocade White", "Cloud Brocade Blue", "Phantom Purple", "Universe Red", "Obsidian Black"] },
  { category: "planshety", name: "Xiaomi Pad 7", slug: "xiaomi-pad-7", brand: "Xiaomi", description: "Xiaomi Pad 7. Цену и доступность подтвердит менеджер.", memories: ["8/128GB", "8/256GB", "12/256GB"], colors: ["Gray", "Blue", "Green"] },
  { category: "planshety", name: "Xiaomi Pad 7 Pro", slug: "xiaomi-pad-7-pro", brand: "Xiaomi", description: "Xiaomi Pad 7 Pro. Цену и доступность подтвердит менеджер.", memories: ["8/128GB", "8/256GB", "12/512GB"], colors: ["Gray", "Blue", "Green"] },
  { category: "planshety", name: "HONOR Pad V9", slug: "honor-pad-v9", brand: "HONOR", description: "HONOR Pad V9. Цену и доступность подтвердит менеджер.", memories: ["24GB / 256GB"], colors: ["White", "Gray"] },

  // Актуальная линейка с официальной витрины GoPro. Комплекты Creator
  // Edition и Ultra Wide Edition не добавляем как отдельные модели: это
  // наборы на базе HERO13 Black, а не самостоятельные камеры.
  { category: "ekshn-kamery", name: "GoPro MISSION 1", slug: "gopro-mission-1", brand: "GoPro", description: "GoPro MISSION 1 — компактная кинематографическая камера с фиксированным объективом. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro MISSION 1 PRO", slug: "gopro-mission-1-pro", brand: "GoPro", description: "GoPro MISSION 1 PRO — профессиональная кинематографическая камера с фиксированным объективом. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro MISSION 1 PRO ILS", slug: "gopro-mission-1-pro-ils", brand: "GoPro", description: "GoPro MISSION 1 PRO ILS с поддержкой сменных объективов Micro Four Thirds. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro HERO13 Black", slug: "gopro-hero13-black", brand: "GoPro", description: "GoPro HERO13 Black. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro HERO12 Black", slug: "gopro-hero12-black", brand: "GoPro", description: "GoPro HERO12 Black. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro MAX2", slug: "gopro-max2", brand: "GoPro", description: "GoPro MAX2 — 360°-камера с записью True 8K. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro MAX", slug: "gopro-max", brand: "GoPro", description: "GoPro MAX — 360°-камера. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro LIT HERO", slug: "gopro-lit-hero", brand: "GoPro", description: "GoPro LIT HERO — компактная 4K-камера со встроенной подсветкой. Цену и доступность подтвердит менеджер.", colors: ["Black"] },
  { category: "ekshn-kamery", name: "GoPro HERO", slug: "gopro-hero", brand: "GoPro", description: "GoPro HERO — компактная 4K-камера. Цену и доступность подтвердит менеджер.", colors: ["Black"] },

  // Sony Xperia: только наиболее свежие официальные поколения. Для Xperia
  // 1 VIII добавлена подтверждённая топовая SIM-free конфигурация; остальные
  // региональные варианты менеджер добавит при появлении в прайсе.
  { category: "telefony", name: "Sony Xperia 1 VIII", slug: "sony-xperia-1-viii", brand: "Sony", description: "Sony Xperia 1 VIII — флагман Xperia с тройной камерой и AI Camera Assistant. Цену, регион и доступность подтвердит менеджер.", memories: ["16GB / 1TB"], colors: ["Graphite Black", "Iolite Silver", "Garnet Red", "Native Gold"] },
  { category: "telefony", name: "Sony Xperia 10 VII", slug: "sony-xperia-10-vii", brand: "Sony", description: "Sony Xperia 10 VII — актуальная модель Xperia 10 с отдельной кнопкой камеры. Цену, регион и доступность подтвердит менеджер.", memories: ["8GB / 128GB"], colors: ["Charcoal Black", "White", "Turquoise"] },

  // Текущая линейка Apple iPad и MacBook Air. Более ранние M3/M4 остаются в
  // базе: импортёр не заменяет товары с реальными ценами из прайса.
  { category: "planshety", name: "iPad Air 11-inch (M4)", slug: "ipad-air-11-m4", brand: "Apple", description: "iPad Air 11-inch с чипом M4. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB", "1TB"], colors: ["Space Gray", "Blue", "Purple", "Starlight"] },
  { category: "planshety", name: "iPad Air 13-inch (M4)", slug: "ipad-air-13-m4", brand: "Apple", description: "iPad Air 13-inch с чипом M4. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB", "1TB"], colors: ["Space Gray", "Blue", "Purple", "Starlight"] },
  { category: "planshety", name: "iPad (A16)", slug: "ipad-a16", brand: "Apple", description: "iPad с чипом A16. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB"], colors: ["Blue", "Pink", "Yellow", "Silver"] },
  { category: "planshety", name: "iPad mini (A17 Pro)", slug: "ipad-mini-a17-pro", brand: "Apple", description: "iPad mini с чипом A17 Pro. Цену и доступность подтвердит менеджер.", memories: ["128GB", "256GB", "512GB"], colors: ["Blue", "Purple", "Starlight", "Space Gray"] },
  { category: "noutbuki", name: "MacBook Air 13-inch (M5)", slug: "macbook-air-13-m5", brand: "Apple", description: "MacBook Air 13-inch с чипом M5. Цену и доступность подтвердит менеджер.", memories: ["16GB / 256GB SSD", "16GB / 512GB SSD", "16GB / 1TB SSD", "16GB / 2TB SSD", "24GB / 512GB SSD", "32GB / 2TB SSD"], colors: ["Sky Blue", "Silver", "Starlight", "Midnight"] },
  { category: "noutbuki", name: "MacBook Air 15-inch (M5)", slug: "macbook-air-15-m5", brand: "Apple", description: "MacBook Air 15-inch с чипом M5. Цену и доступность подтвердит менеджер.", memories: ["16GB / 256GB SSD", "16GB / 512GB SSD", "16GB / 1TB SSD", "16GB / 2TB SSD", "24GB / 512GB SSD", "32GB / 2TB SSD"], colors: ["Sky Blue", "Silver", "Starlight", "Midnight"] },

  // Текущие доступные планшеты Samsung и недостающая классическая версия Watch8.
  { category: "planshety", name: "Samsung Galaxy Tab S10 FE", slug: "samsung-galaxy-tab-s10-fe", brand: "Samsung", description: "Samsung Galaxy Tab S10 FE. Цену и доступность подтвердит менеджер.", memories: ["8/128GB", "12/256GB"], colors: ["Gray", "Silver", "Blue"] },
  { category: "planshety", name: "Samsung Galaxy Tab S10 FE+", slug: "samsung-galaxy-tab-s10-fe-plus", brand: "Samsung", description: "Samsung Galaxy Tab S10 FE+. Цену и доступность подтвердит менеджер.", memories: ["8/128GB", "12/256GB"], colors: ["Gray", "Silver", "Blue"] },
  { category: "planshety", name: "Samsung Galaxy Tab S10 Lite", slug: "samsung-galaxy-tab-s10-lite", brand: "Samsung", description: "Samsung Galaxy Tab S10 Lite. Цену и доступность подтвердит менеджер.", memories: ["6/128GB", "8/256GB"], colors: ["Gray", "Silver", "Coral Red"] },
  { category: "planshety", name: "Samsung Galaxy Tab A11+", slug: "samsung-galaxy-tab-a11-plus", brand: "Samsung", description: "Samsung Galaxy Tab A11+. Цену и доступность подтвердит менеджер.", memories: ["6/128GB", "8/256GB"], colors: ["Gray", "Silver"] },
  { category: "chasy", name: "Samsung Galaxy Watch8 Classic", slug: "samsung-galaxy-watch8-classic", brand: "Samsung", description: "Samsung Galaxy Watch8 Classic. Цену и доступность подтвердит менеджер.", colors: ["Black", "White"] },

  // Текущие новинки HONOR с глобальной витрины. Память не фиксируем: состав
  // конфигураций меняется по рынкам, а прайс поставщика дополняет её точно.
  { category: "telefony", name: "HONOR Magic V6", slug: "honor-magic-v6", brand: "HONOR", description: "HONOR Magic V6 — складной флагман HONOR. Цену, память, регион и доступность подтвердит менеджер.", colors: ["Red", "Gold", "White", "Black"] },
  { category: "telefony", name: "HONOR 600 Pro", slug: "honor-600-pro", brand: "HONOR", description: "HONOR 600 Pro. Цену, память, регион и доступность подтвердит менеджер.", colors: ["Golden White", "Orange", "Black"] },
  { category: "telefony", name: "HONOR 600", slug: "honor-600", brand: "HONOR", description: "HONOR 600. Цену, память, регион и доступность подтвердит менеджер.", colors: ["Sprout Green", "Desert Gold", "Velvet Grey", "Velvet Black"] },
  { category: "telefony", name: "HONOR 600 Lite", slug: "honor-600-lite", brand: "HONOR", description: "HONOR 600 Lite. Цену, память, регион и доступность подтвердит менеджер.", colors: ["Meteor Silver", "Velvet Black"] },
  { category: "telefony", name: "HONOR X9d", slug: "honor-x9d", brand: "HONOR", description: "HONOR X9d с усиленной защитой корпуса. Цену, память, регион и доступность подтвердит менеджер.", colors: ["Sunrise Orange", "Desert Gold", "Velvet Black"] },

  // Новая глобальная линейка HUAWEI. Варианты памяти и цвета на глобальной
  // витрине зависят от страны, поэтому оставляем их прайсу поставщика.
  { category: "telefony", name: "HUAWEI Pura 90s Pro Max", slug: "huawei-pura-90s-pro-max", brand: "HUAWEI", description: "HUAWEI Pura 90s Pro Max. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI Pura 90s Pro", slug: "huawei-pura-90s-pro", brand: "HUAWEI", description: "HUAWEI Pura 90s Pro. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI Pura 80 Pro", slug: "huawei-pura-80-pro", brand: "HUAWEI", description: "HUAWEI Pura 80 Pro. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI Pura 80 Ultra", slug: "huawei-pura-80-ultra", brand: "HUAWEI", description: "HUAWEI Pura 80 Ultra. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI Mate 80 Pro", slug: "huawei-mate-80-pro", brand: "HUAWEI", description: "HUAWEI Mate 80 Pro. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI Mate XT ULTIMATE DESIGN", slug: "huawei-mate-xt-ultimate-design", brand: "HUAWEI", description: "HUAWEI Mate XT ULTIMATE DESIGN. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI nova 15 Max", slug: "huawei-nova-15-max", brand: "HUAWEI", description: "HUAWEI nova 15 Max. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI nova 15 Pro", slug: "huawei-nova-15-pro", brand: "HUAWEI", description: "HUAWEI nova 15 Pro. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
  { category: "telefony", name: "HUAWEI nova 15", slug: "huawei-nova-15", brand: "HUAWEI", description: "HUAWEI nova 15. Цену, варианты памяти, регион и доступность подтвердит менеджер.", colors: [] },
];
