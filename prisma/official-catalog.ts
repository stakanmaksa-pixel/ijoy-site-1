// Каталог моделей без цен. Источники на 01.09.2026: официальные страницы
// производителей. Эти записи не заменяют прайс поставщика: у каждой
// модификации price: null, поэтому на витрине выводится «Уточняйте цену».

export type OfficialCatalogEntry = {
  category: "telefony" | "chasy" | "planshety" | "noutbuki";
  name: string;
  slug: string;
  brand: string;
  description: string;
  memories?: string[];
  colors: string[];
};

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
];
