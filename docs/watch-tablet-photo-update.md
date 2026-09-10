# Фотографии часов и планшетов — 10 сентября 2026

Подготовлены 39 фотографий для 13 моделей:

- Samsung Galaxy Watch8, Watch8 Classic, Watch Ultra и Watch9 (40/44 мм).
- HUAWEI WATCH FIT 5, FIT 5 Pro, Ultimate 2 и GT Runner 2.
- HUAWEI MatePad Mini, MatePad Air и MatePad Pro Max.
- Xiaomi Pad 7 и Pad 7 Pro — Gray, Blue, Green.

Оригиналы с официальных сайтов, источники и SHA-256: `prisma/data/watch-tablet-photo-sources.json`.
Изображения используют существующий общий масштаб карточек: весь предмет помещается внутри области фото.
Watch Ultra2 уже имел фотографию, его данные не меняются.

Обновление меняет только `images` и `colorImages` у опубликованных целевых товаров. Не создаёт и не удаляет модификации, не меняет цены, наличие, описания или статус. У Huawei с ещё не настроенными цветами появляется обложка; цветовые фотографии сохранены для последующего наполнения вариантов. Неизвестный цвет/размер без своей фотографии останавливает всю транзакцию, а не получает чужое фото.

## Сервер

В каталоге проекта выполняйте по одной команде. Если команда завершилась ошибкой, остановитесь.

```bash
git pull --ff-only origin main
docker compose --env-file .env.docker build app migrate
docker compose --env-file .env.docker up -d --no-deps app
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-watch-tablet-photos.ts --dry-run
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-watch-tablet-photos.ts
```

Сначала выкладываются файлы фотографий вместе с приложением, затем ссылки на них записываются в базу.
Скрипт перед записью сохраняет прежние данные в `/app/backups/watch-tablet-photos/photos-<timestamp>.json` (постоянный Docker-том `catalog_backups`, не публичная папка сайта). Повторный запуск безопасен.

После запуска проверьте указанные модели, выбор цвета и отсутствие заглушек. Для Watch9 проверьте оба размера. Если выводится `SKIP`, скрытая или отсутствующая карточка не была изменена.

## Проверки

60 автоматических тестов, TypeScript и production-сборка Next.js прошли. В браузере проверена локальная витрина с настоящим `ProductCard` и production-CSS на ширине 1280 и 375 пикселей: 13 обложек загружены, горизонтального переполнения нет. Все 39 оригиналов отдельно проверены на контактном листе. Это проверка кода и фотографий без производственной базы; применение на сервере выполняется командами выше.
