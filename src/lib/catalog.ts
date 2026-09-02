import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { pickCoverImage } from "@/lib/pickCoverImage";

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
    "Samsung Galaxy S25 Ultra",
    "Samsung Galaxy S25 FE 5G",
    "Samsung Galaxy S25",
    "Samsung Galaxy S23+",
    "Samsung Galaxy A57 5G",
    "Samsung Galaxy A56 5G",
    "Samsung Galaxy A37 5G",
    "Samsung Galaxy A27 5G",
    "Samsung Galaxy A17 4G",
    "Samsung Galaxy A16",
    "Samsung Galaxy M56 5G",
  ],
  sony: ["Sony Xperia 1 VIII", "Sony Xperia 10 VII"],
  ipad: [
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
  macbook: [
    "MacBook Neo",
    "MacBook Neo 13-inch",
    "MacBook Air 15-inch (M5)",
    "MacBook Air 13-inch (M5)",
    "MacBook Air 15",
    "MacBook Air 15 (2025, M4)",
    "MacBook Air 13",
    "MacBook Pro 14",
    "MacBook Pro 14 (2025, M5)",
  ],
  watch: ["Apple Watch Ultra 3", "Apple Watch Series 11", "Apple Watch SE 3", "Apple Watch SE"],
  airpods: [
    "AirPods Pro 3",
    "AirPods Pro 2 Type-C",
    "AirPods 4 ANC",
    "AirPods 4",
    "AirPods Max 2",
    "AirPods Max",
  ],
  gopro: [
    "GoPro MISSION 1 PRO ILS",
    "GoPro MISSION 1 PRO",
    "GoPro MISSION 1",
    "GoPro MAX2",
    "GoPro HERO13 Black",
    "GoPro HERO12 Black",
    "GoPro MAX",
    "GoPro LIT HERO",
    "GoPro HERO",
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
    return undefined;
  }
  if (categorySlug === "planshety") return MODEL_DISPLAY_ORDER.ipad;
  if (categorySlug === "noutbuki") return MODEL_DISPLAY_ORDER.macbook;
  if (categorySlug === "chasy") return MODEL_DISPLAY_ORDER.watch;
  if (categorySlug === "ekshn-kamery") return MODEL_DISPLAY_ORDER.gopro;
  if (categorySlug === "aksessuary" && /^AirPods/.test(name)) return MODEL_DISPLAY_ORDER.airpods;
  return undefined;
}

type LineMatcher = {
  label: string;
  test: (name: string, brand: string | null) => boolean;
  groupHref?: string;
  order?: readonly string[];
};

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
    },
    {
      label: "Sony Xperia",
      test: (_n, brand) => brand === "Sony",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Sony")}`,
      order: MODEL_DISPLAY_ORDER.sony,
    },
    {
      label: "Xiaomi и REDMI",
      test: (_n, brand) => brand === "Xiaomi",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("Xiaomi")}`,
    },
    {
      label: "POCO",
      test: (_n, brand) => brand === "POCO",
      groupHref: `/catalog?category=telefony&brand=${encodeURIComponent("POCO")}`,
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
    { label: "Apple iPad", test: (_name, brand) => brand === "Apple", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("Apple")}`, order: MODEL_DISPLAY_ORDER.ipad },
    { label: "Samsung Galaxy Tab", test: (_name, brand) => brand === "Samsung", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("Samsung")}` },
    { label: "Xiaomi Pad", test: (_name, brand) => brand === "Xiaomi", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("Xiaomi")}` },
    { label: "HUAWEI MatePad", test: (_name, brand) => brand === "HUAWEI", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("HUAWEI")}` },
    { label: "HONOR Pad", test: (_name, brand) => brand === "HONOR", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("HONOR")}` },
    { label: "OnePlus Pad", test: (_name, brand) => brand === "OnePlus", groupHref: `/catalog?category=planshety&brand=${encodeURIComponent("OnePlus")}` },
  ],
  chasy: [
    { label: "Apple Watch", test: (_name, brand) => brand === "Apple", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("Apple")}`, order: MODEL_DISPLAY_ORDER.watch },
    { label: "Samsung Galaxy Watch", test: (_name, brand) => brand === "Samsung", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("Samsung")}` },
    { label: "HUAWEI Watch", test: (_name, brand) => brand === "HUAWEI", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("HUAWEI")}` },
    { label: "OnePlus Watch", test: (_name, brand) => brand === "OnePlus", groupHref: `/catalog?category=chasy&brand=${encodeURIComponent("OnePlus")}` },
  ],
};

// Категории без деления на линейки (один бренд на категорию) — тут просто
// сортируем весь список товаров по тому же принципу "новые сверху".
const CATEGORY_ORDER: Record<string, readonly string[]> = {
  chasy: MODEL_DISPLAY_ORDER.watch,
  planshety: MODEL_DISPLAY_ORDER.ipad,
  noutbuki: MODEL_DISPLAY_ORDER.macbook,
  "ekshn-kamery": MODEL_DISPLAY_ORDER.gopro,
};

export async function getCatalogNavTree(): Promise<CatalogNavNode[]> {
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
        const items = category.products
          .filter((p) => matcher.test(p.name, p.brand))
          // Новые модели сверху — для линеек без заданного порядка
          // сортировка ничего не меняет, они остаются в прежнем порядке
          // (по имени).
          .slice()
          .sort((a, b) => rankInList(matcher.order, a.name) - rankInList(matcher.order, b.name))
          .map((p) => {
            matchedSlugs.add(p.slug);
            return { label: p.name, href: `/product/${p.slug}` };
          });
        if (items.length > 0) {
          groups.push({ label: matcher.label, href: matcher.groupHref, children: items });
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
}

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
  brand?: string;
  productSlug?: string;
  memory?: string;
  color?: string;
  onlyInStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  // Поиск по названию/бренду товара (шапка сайта, форма без JS на /catalog).
  search?: string;
};

export async function getPublishedProducts(filters: CatalogFilters = {}) {
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

  if (filters.brand) {
    where.brand = filters.brand;
  }

  if (filters.productSlug) {
    where.slug = filters.productSlug;
  }

  const variantWhere: Prisma.ProductVariantWhereInput = {};
  if (filters.minPrice != null || filters.maxPrice != null) {
    variantWhere.price = { gte: filters.minPrice, lte: filters.maxPrice };
  }
  if (filters.memory) variantWhere.memory = filters.memory;
  if (filters.color) variantWhere.color = filters.color;
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

  return sorted.map((product) => {
    const visibleVariants = Object.keys(variantWhere).length > 0
      ? product.variants.filter((variant) => {
          if (filters.minPrice != null && (variant.price === null || Number(variant.price) < filters.minPrice)) return false;
          if (filters.maxPrice != null && (variant.price === null || Number(variant.price) > filters.maxPrice)) return false;
          if (filters.memory && variant.memory !== filters.memory) return false;
          if (filters.color && variant.color !== filters.color) return false;
          if (filters.onlyInStock && !variant.inStock) return false;
          return true;
        })
      : product.variants;
    return toProductSummary(product, visibleVariants);
  });
}

export async function getCatalogFilterOptions(filters: Pick<CatalogFilters, "categorySlug" | "brand" | "productSlug"> = {}) {
  const where: Prisma.ProductWhereInput = { status: "PUBLISHED" };
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.brand) where.brand = filters.brand;
  if (filters.productSlug) where.slug = filters.productSlug;

  const products = await prisma.product.findMany({
    where,
    select: {
      name: true,
      slug: true,
      variants: { select: { memory: true, color: true } },
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
  };
}

export async function getDistinctBrands() {
  const rows = await prisma.product.findMany({
    where: { status: "PUBLISHED", brand: { not: null } },
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
    variants: product.variants.map((v) => ({
      id: v.id,
      memory: v.memory,
      color: v.color,
      region: v.region,
      // null — комбинации нет в прайсе, цена уточняется у менеджера
      // (см. prisma/seed.ts, buildLiveIphoneProducts).
      price: v.price !== null ? Number(v.price) : null,
      inStock: v.inStock,
    })),
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
export async function getIphoneCompareLineup(): Promise<CompareModel[]> {
  const products = await prisma.product.findMany({
    where: { status: "PUBLISHED", brand: "Apple", name: { startsWith: "iPhone" } },
    include: { variants: true },
  });

  const sorted = [...products].sort(
    (a, b) => rankInList(MODEL_DISPLAY_ORDER.iphone, a.name) - rankInList(MODEL_DISPLAY_ORDER.iphone, b.name),
  );

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
          region: v.region,
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
    coverImage: pickCoverImage(
      product.images,
      (product.colorImages as Record<string, string[]> | null) ?? null,
      cheapest?.color,
    ),
  };
}
