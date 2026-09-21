# Каталог и фото — 21 сентября 2026

Точечное обновление добавляет или проверяет Dyson CameraJet, Samsung Galaxy S26 FE, Apple Watch Series 12, AirPods 5, AirPods 5 Wireless, Garmin CIRQA Smart Band, HUAWEI FreeClip 2, iPhone 18 Pro / Pro Max, iPhone Duo, Apple Watch Ultra 4 и HUAWEI Pura 90s Pro.

Скрипт не меняет существующие цены, остатки, SKU и идентификаторы вариантов. Перед первой записью создаётся JSON-бэкап в Docker volume `catalog_backups`. Фото поставляются вместе с образом приложения и не зависят от runtime-volume загрузок.

Общий коллаж Apple Watch Ultra 4, общие кадры iPhone 18, iPhone Duo и Dyson CameraJet хранятся как обложки модели. После выбора цвета галерея переключается на точное фото варианта.

## Обновление сервера

```bash
cd /opt/ijoy-site && \
git pull --ff-only && \
docker compose --env-file .env.docker build app migrate && \
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-september-2026-catalog.ts --dry-run && \
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-september-2026-catalog.ts && \
docker compose --env-file .env.docker up -d --no-deps app
```

После обновления проверить карточки `dyson-camerajet`, `samsung-galaxy-s26-fe`, `apple-watch-series-12`, `apple-watch-ultra-4`, `airpods-5`, `airpods-5-wireless`, `garmin-cirqa-smart-band`, `huawei-freeclip-2`, `iphone-18-pro`, `iphone-18-pro-max`, `iphone-duo` и белый вариант `huawei-pura-90s-pro`.
