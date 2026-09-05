// Точечное обновление характеристик (specs/highlights/сравнение с прошлым
// поколением) у уже существующих товаров iPhone в боевой БД — без полного
// prisma/seed.ts.
//
// Почему не просто запустить seed.ts заново: seed.ts пересоздаёт все
// модификации (ProductVariant) из статического снимка прайса
// (prisma/data/live-pricelist-*.txt), сделанного в момент, когда этот файл
// последний раз обновлялся. На боевом сайте цены/остатки с тех пор много раз
// обновлял бот через /api/bot/price-import — повторный seed откатил бы их
// обратно к снимку. Этот скрипт трогает только Product.specs и соседние
// текстовые поля, ProductVariant не касается вообще.
//
// Запуск (после деплоя обновлённого кода):
//   docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-iphone-specs.ts

import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { IPHONE_DISPLAY_NAME_OVERRIDES, IPHONE_CONTENT_OVERRIDES } from "../iphone-content";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function assertSameSpecKeys(models: string[]) {
  const [referenceModel, ...rest] = models;
  const reference = Object.keys(IPHONE_CONTENT_OVERRIDES[referenceModel]?.specs ?? {}).sort();
  for (const model of rest) {
    const current = Object.keys(IPHONE_CONTENT_OVERRIDES[model]?.specs ?? {}).sort();
    if (reference.join("\n") !== current.join("\n")) {
      throw new Error(`${model}: набор характеристик отличается от ${referenceModel}`);
    }
  }
}

async function main() {
  // Эти модели участвуют в прямом сравнении и обязаны иметь одинаковые
  // названия строк, иначе значения визуально разъедутся по таблице.
  assertSameSpecKeys(["17 Pro Max", "17 Pro"]);
  let updated = 0;
  let notFound = 0;

  for (const [model, content] of Object.entries(IPHONE_CONTENT_OVERRIDES)) {
    const displayModel = IPHONE_DISPLAY_NAME_OVERRIDES[model] ?? model;
    const name = `iPhone ${displayModel}`;

    const result = await prisma.product.updateMany({
      where: { name },
      data: {
        description: content.description,
        specs: content.specs,
        highlights: content.highlights,
        previousGenLabel: content.previousGenLabel ?? null,
        previousGenHighlights: content.previousGenHighlights ?? [],
      },
    });

    if (result.count > 0) {
      updated += result.count;
      console.log(`OK   ${name}`);
    } else {
      notFound++;
      console.log(`--   ${name} (нет в продаже сейчас, пропущено)`);
    }
  }

  console.log(`\nГотово: обновлено ${updated}, не найдено (сейчас нет в прайсе) ${notFound}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
