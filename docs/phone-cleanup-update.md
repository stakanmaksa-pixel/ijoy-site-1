# Телефоны без фото, ширина карточек и короткое меню — 10 сентября 2026

## Состав обновления

- POCO M8 5G: 9 вариантов (8/256, 8/512, 12/512 ГБ × Black/Silver/Green).
- POCO M8 Pro 5G: 6 вариантов (8/256, 12/512 ГБ × Black/Silver/Green).
- 12 оригинальных изображений с официального магазина. Источники и SHA-256: `prisma/data/poco-m8-photo-sources.json`. Характеристики — [M8](https://www.mi.com/global/product/poco-m8-5g/specs/) и [M8 Pro](https://www.mi.com/global/product/poco-m8-pro-5g/specs/).
- По запросу пользователя скрываются только семь старых моделей со скриншотов: Xiaomi 15 Ultra, 15T/15T Pro, REDMI 15/15 5G, Redmi Note 14, POCO X7 Pro. Их предложения, цены, наличие и ID не удаляются. Более новые линейки подтверждены официальными страницами [Xiaomi 17T Pro](https://www.mi.com/global/product/xiaomi-17t-pro/), [17 Ultra](https://www.mi.com/global/product/xiaomi-17-ultra/), [REDMI 17 5G](https://www.mi.com/ae-en/product/redmi-17-5g/specs/), [Note 15](https://www.mi.com/global/product/redmi-note-15/) и [POCO X8 Pro](https://www.mi.com/global/product/poco-x8-pro/).
- В каталоге ширина ограничена 1440px. На больших экранах число колонок определяется доступным местом: карточки не сжимаются ниже 240px. Мобильная сетка остаётся двухколоночной.
- Заголовки выводятся полностью. Номера прикреплены неразрывным пробелом к предыдущему слову; нет обрезки и многоточий.
- В обеих версиях меню убраны повторяющиеся названия родительских линеек; столбцы расширены до 256px. В смешанной группе «Xiaomi и REDMI» слово REDMI сохранено, чтобы не путать разные линейки.

## Сервер

Проверки: 53 теста и production-сборка прошли. Локальная визуальная проверка настоящих карточек с production CSS выполнена на ширинах 375 и 1280px; горизонтального переполнения нет. Короткие подписи и ширина колонок меню проверены на отдельном макете. На рабочем сервере изменения ещё нужно применить командами ниже.

Скрипт только для этой задачи — предыдущий `sync-phone-enrichment.ts` повторять не требуется. Выполнять из папки проекта по одной команде, останавливаясь при ошибке:

```sh
git pull --ff-only origin main
docker compose --env-file .env.docker build app migrate
docker compose --env-file .env.docker up -d --no-deps app
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-phone-catalog-cleanup.ts --dry-run
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-phone-catalog-cleanup.ts
```

Перед записью создаётся JSON-копия целевых товаров в `/app/backups/phone-cleanup/` постоянного тома `catalog_backups`. Старые товары получают `HIDDEN`; для возврата можно восстановить прежний статус в админке. Пустые старые варианты M8 сохраняются в скрытом архиве. Новые варианты создаются без выдуманных цен и наличия.

Скрытые модели M8 не публикуются повторно. Нераспознанные реальные предложения останавливают транзакцию. После применения проверить M8/M8 Pro, отсутствие семи старых моделей в каталоге, короткие названия меню и сетку на телефоне и компьютере. Меню обновляет кеш в течение минуты.
