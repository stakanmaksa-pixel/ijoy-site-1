# Фотографии DualSense и Fitbit

29 отдельных оригиналов: 13 изданий DualSense, 11 обычных цветов DualSense, 5 вариантов Fitbit Air. Фото выбирается по точному ключу модификации. Общая привязка Limited Edition удалена. Stephen Curry исправлен с Blue на официальное название Rye, ID и цена сохранены.

Источники: [DualSense](https://www.playstation.com/en-gb/accessories/dualsense-wireless-controller/), [Google Store](https://store.google.com/us/config/google_fitbit_air?hl=en-US). Адреса оригиналов сохранены в `prisma/data/accessory-variant-photos.ts`. Изображения не перекрашивались.

Запуск из папки сайта на сервере. Выполнять по одной команде, при ошибке остановиться:

```bash
git pull --ff-only origin main
docker compose --env-file .env.docker build app migrate
docker compose --env-file .env.docker up -d --no-deps app
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-accessory-variant-photos.ts --dry-run
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-accessory-variant-photos.ts
```

Последняя команда необходима: пересборка сама не меняет привязки в базе. Скрипт сохраняет прежние записи в `/app/backups/accessory-variant-photos` (постоянный том резервных копий). Меняет только фотографии трёх целевых товаров и ошибочный цвет Stephen Curry; не меняет цены, наличие, публикацию или ID. Неизвестная модификация или отсутствующий файл остановят обновление до записи.

После обновления проверить переключение Marathon / 30th Anniversary / Fortnite, цвета обычного DualSense и пять карточек Fitbit. Цена и выбранное издание должны соответствовать фото.
