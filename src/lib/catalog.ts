import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

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
const MODEL_DISPLAY_ORDER = {
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
    "iPhone 15 Pro Max",
    "iPhone 15 Pro",
    "iPhone 15 Plus",
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
  ipad: [
    "iPad Pro 11 (2025, M5)",
    "iPad Air 13 (2025, M3)",
    "iPad Air 11 (2025, M3)",
    "iPad 11 (2025)",
    "iPad Mini 7",
    "iPad Air 8 11",
  ],
  macbook: [
    "MacBook Neo",
    "MacBook Air 15",
    "MacBook Air 15 (2025, M4)",
    "MacBook Air 13",
    "MacBook Pro 14",
  ],
  watch: ["Apple Watch Ultra 3", "Apple Watch S11", "Apple Watch SE 3", "Apple Watch SE"],
  airpods: [
    "AirPods Pro 3",
    "AirPods Pro 2 Type-C",
    "AirPods 4 ANC",
    "AirPods 4",
    "AirPods Max 2",
    "AirPods Max",
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
    return undefined;
  }
  if (categorySlug === "planshety") return MODEL_DISPLAY_ORDER.ipad;
  if (categorySlug === "noutbuki") return MODEL_DISPLAY_ORDER.macbook;
  if (categorySlug === "chasy") return MODEL_DISPLAY_ORDER.watch;
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
  ],
  aksessuary: [
    { label: "Наушники AirPods", test: (name) => /airpods/i.test(name), order: MODEL_DISPLAY_ORDER.airpods },
    { label: "Apple TV", test: (name) => /apple\s*tv/i.test(name) },
  ],
};

// Категории без деления на линейки (один бренд на категорию) — тут просто
// сортируем весь список товаров по тому же принципу "новые сверху".
const CATEGORY_ORDER: Record<string, readonly string[]> = {
  chasy: MODEL_DISPLAY_ORDER.watch,
  planshety: MODEL_DISPLAY_ORDER.ipad,
  noutbuki: MODEL_DISPLAY_ORDER.macbook,
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
  minPrice?: number;
  maxPrice?: number;
};

export async function getPublishedProducts(filters: CatalogFilters = {}) {
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
  };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug };
  }

  if (filters.brand) {
    where.brand = filters.brand;
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.variants = {
      some: {
        price: {
          gte: filters.minPrice,
          lte: filters.maxPrice,
        },
      },
    };
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

  return sorted.map(toProductSummary);
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
        },
      ]),
  );

  // Сохраняем порядок, в котором id пришли (порядок добавления в избранное).
  return variantIds
    .map((id) => byId.get(id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
}

function toProductSummary(
  product: Prisma.ProductGetPayload<{
    include: { category: true; variants: true };
  }>,
) {
  // Модификации с ценой "уточняйте у менеджера" (price: null) не участвуют
  // в подсчёте минимальной цены на карточке товара.
  const priced = product.variants.filter((v) => v.price !== null);
  const prices = priced.map((v) => Number(v.price));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const hasStock = product.variants.some((v) => v.inStock);

  // "Представительская" модификация карточки товара (сетка каталога/Новинки)
  // — самая дешёвая (та же, что определяет minPrice выше), либо просто
  // первая, если цены нет ни у одной. Именно её id получает сердечко
  // избранного на карточке товара, где нет собственного выбора модификации.
  const cheapest =
    priced.length > 0
      ? priced.reduce((min, v) => (Number(v.price) < Number(min.price) ? v : min))
      : product.variants[0];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    minPrice,
    hasStock,
    variantCount: product.variants.length,
    defaultVariantId: cheapest?.id ?? null,
  };
}
