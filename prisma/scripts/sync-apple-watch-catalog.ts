// Добавляет выбор размера корпуса, цвета и ремешка для актуальных Apple Watch.
// Неизвестные цены намеренно остаются null: на витрине это «Уточняйте у менеджера».
// docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-apple-watch-catalog.ts

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

type WatchOption = { size: string; caseColor: string; band: string };
const option = (size: string, caseColor: string, band: string): WatchOption => ({ size, caseColor, band });

const series11: WatchOption[] = [
  ...["Space Gray", "Rose Gold", "Jet Black", "Silver"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("42 мм", caseColor, `Sport Band (${caseColor === "Rose Gold" ? "Light Blush" : caseColor === "Silver" ? "Purple Fog" : "Black"}) ${fit}`))),
  ...["Space Gray", "Rose Gold", "Jet Black", "Silver"].flatMap((caseColor) => ["S/M", "M/L"].map((fit) => option("46 мм", caseColor, `Sport Band (${caseColor === "Rose Gold" ? "Light Blush" : caseColor === "Silver" ? "Purple Fog" : "Black"}) ${fit}`))),
  option("42 мм", "Gold Titanium", "Milanese Loop (Gold)"),
  option("42 мм", "Natural Titanium", "Milanese Loop (Natural)"),
  option("42 мм", "Slate Titanium", "Milanese Loop (Slate)"),
  option("46 мм", "Gold Titanium", "Milanese Loop (Gold) S/M"),
  option("46 мм", "Gold Titanium", "Milanese Loop (Gold) M/L"),
  option("46 мм", "Natural Titanium", "Milanese Loop (Natural) S/M"),
  option("46 мм", "Natural Titanium", "Milanese Loop (Natural) M/L"),
  option("46 мм", "Slate Titanium", "Milanese Loop (Slate) S/M"),
  option("46 мм", "Slate Titanium", "Milanese Loop (Slate) M/L"),
];

const ultra3: WatchOption[] = [
  option("49 мм", "Black Titanium", "Trail Loop (Black/Charcoal) S/M"), option("49 мм", "Black Titanium", "Trail Loop (Black/Charcoal) M/L"),
  option("49 мм", "Black Titanium", "Alpine Loop (Black) S"), option("49 мм", "Black Titanium", "Alpine Loop (Black) M"), option("49 мм", "Black Titanium", "Alpine Loop (Black) L"),
  option("49 мм", "Black Titanium", "Alpine Loop (Light Blue) M"), option("49 мм", "Black Titanium", "Ocean Band (Black)"), option("49 мм", "Black Titanium", "Ocean Band (Neon Green)"),
  option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) S"), option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) M"), option("49 мм", "Black Titanium", "Milanese Loop (Black Titanium) L"),
  option("49 мм", "Natural Titanium", "Trail Loop (Blue/Bright Blue) S/M"), option("49 мм", "Natural Titanium", "Trail Loop (Blue/Bright Blue) M/L"),
  option("49 мм", "Natural Titanium", "Alpine Loop (Black) L"), option("49 мм", "Natural Titanium", "Alpine Loop (Light Blue) M"), option("49 мм", "Natural Titanium", "Ocean Band (Anchor Blue)"),
  option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) S"), option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) M"), option("49 мм", "Natural Titanium", "Milanese Loop (Natural Titanium) L"),
];

const se3: WatchOption[] = [
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["Sport Band", "Sport Loop"].flatMap((band) => ["S/M", "M/L"].map((fit) => option("40 мм", caseColor, `${band} ${fit}`)))),
  ...["Starlight", "Midnight"].flatMap((caseColor) => ["Sport Band", "Sport Loop"].flatMap((band) => ["S/M", "M/L"].map((fit) => option("44 мм", caseColor, `${band} ${fit}`)))),
];

const data = [
  { slug: "apple-watch-ultra-3", description: "Apple Watch Ultra 3 с корпусом 49 мм. Выберите цвет корпуса и ремешок. Цену и доступность подтвердит менеджер.", options: ultra3 },
  { slug: "apple-watch-series-11", description: "Apple Watch Series 11. Выберите размер корпуса, цвет и ремешок. Цену и доступность подтвердит менеджер.", options: series11 },
  { slug: "apple-watch-se-3", description: "Apple Watch SE 3. Выберите размер корпуса, цвет и ремешок. Цену и доступность подтвердит менеджер.", options: se3 },
];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const entry of data) {
    const product = await prisma.product.findUnique({ where: { slug: entry.slug }, include: { variants: true } });
    if (!product) {
      console.log(`SKIP ${entry.slug}: товара нет в базе`);
      continue;
    }
    // Заменяем только сгенерированные варианты без прайсовой цены. Реальные
    // строки поставщика не трогаем.
    await prisma.productVariant.deleteMany({ where: { productId: product.id, price: null } });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        description: entry.description,
        variants: { create: entry.options.map((item) => ({ memory: item.size, color: item.caseColor, region: item.band, price: null, inStock: true, rawLabel: `${product.name} ${item.size}, ${item.caseColor}, ${item.band} — уточнить у менеджера` })) },
      },
    });
    console.log(`OK   ${product.name}: ${entry.options.length} вариантов`);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
