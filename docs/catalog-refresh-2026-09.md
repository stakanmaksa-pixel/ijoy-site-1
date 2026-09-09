# Обновление каталога: Samsung, телефоны и клавиатуры

## Что меняется

- Меню Samsung ведёт сразу на `/product/<модель>` с сеткой модификаций. Региональные предложения объединяются только для показа по памяти и цвету; их записи и цены в базе не удаляются. Старые ссылки с ID региона открывают соответствующую публичную модификацию.
- В каталоге Magic Keyboard показываются девять отдельных цветовых вариантов пяти моделей. Белый и чёрный находятся рядом; фото, цена, избранное и корзина привязаны к точному варианту. В меню клавиатур нет дополнительного уровня моделей.
- Скрипт подготавливает 39 моделей товаров и аксессуаров. Уже существующие карточки обновляются, новые создаются. Новые предложения имеют `price: null`, `inStock: false`: цену и наличие нужно получить из прайса, они не выдуманы.
- Samsung-планшеты: Tab S11 Ultra, S11, S10+, S10 Lite, S10 FE, S10 FE+, A11 и A11+. Другие Samsung-планшеты скрываются, но не удаляются. Для каждой расцветки есть два оригинальных ракурса.
- Для планшетов добавлены пять подходящих Book Cover Keyboard Slim и три сменных S Pen. На Tab S указано, что перо уже в комплекте. Для A11/A11+ S Pen не предлагается: эти модели его не поддерживают.
- Часы: Galaxy Watch9 и Watch Ultra2; Watch7 и OnePlus Watch скрываются. Остальные часы не затрагиваются.
- Sony: только Xperia 1 VII, 256/512 ГБ и три цвета, включая разные объёмы RAM для 512 ГБ.
- Google: Pixel 11, 11 Pro, 11 Pro XL, 11 Pro Fold и 10a. Комбинации памяти и цвета взяты из официального конфигуратора, а не из полного произведения списков.
- POCO: C81 Pro, X8 Pro, X8 Pro Max, F8 Pro, F8 Ultra и F9 Ultra. Xiaomi: 17, 17 Ultra, 17T и 17T Pro. REDMI: Note 15 / Note 15 5G / Note 15 Pro / Note 15 Pro 5G / Note 15 Pro+ 5G.
- Смартфоны и Samsung-планшеты доступны в сравнении. Добавлен поиск модели в сравнении, фото используют общее аккуратное вписывание.

У Xiaomi/POCO используются официальные групповые фотографии цветовой линейки, а не индивидуальные снимки каждого цвета; это явно написано в описаниях. Их последующая замена на отдельные цветовые ракурсы остаётся возможным улучшением. Sony и Pixel имеют отдельные фото цветов.

## Данные и источники

Источники характеристик сохранены в `sources` каждого файла `prisma/data/*-catalog.ts`, оригиналы фотографий — в `prisma/data/catalog-refresh-photo-sources.json`. Изображения не генерировались и не дорисовывались. Масштабирование выполняется стилями общего компонента карточек, без растяжения корпуса.

Основные первичные источники:

- [Samsung Tab S11](https://www.samsung.com/uk/tablets/galaxy-tab-s/galaxy-tab-s11-grey-128gb-wi-fi-sm-x730nzareub/buy/)
- [Samsung Tab S10 FE](https://news.samsung.com/global/galaxy-tab-s10-fe-series-brings-intelligent-experiences-to-the-forefront-with-premium-versatile-design)
- [Совместимость Samsung Tab A11/A11+](https://www.samsung.com/co/support/mobile-devices/features-of-the-galaxy-tab-a11-and-tab-a11/)
- [Samsung Watch9 и Watch Ultra2](https://news.samsung.com/uk/samsung-galaxy-watch-ultra2-and-watch9-your-health-companion-on-the-wrist)
- [Google Pixel 11 Pro](https://store.google.com/product/pixel_11_pro_specs?hl=en-US)
- [Sony Xperia 1 VII](https://www.sony.jp/xperia/products/xperia1m7/spec.html)
- [Xiaomi 17 Ultra](https://www.mi.com/global/product/xiaomi-17-ultra/specs/)
- [POCO F9 Ultra](https://www.mi.com/es/product/poco-f9-ultra/specs/)

## Обновление сервера

Выполнять из существующей папки репозитория iJoy на сервере. Новую схему БД этот пакет не требует. Не запускать полный seed или старые импорты прайса.

```bash
git pull --ff-only origin main &&
docker compose --env-file .env.docker build app migrate &&
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-catalog-refresh.ts --dry-run &&
docker compose --env-file .env.docker run --rm migrate npx tsx prisma/scripts/sync-catalog-refresh.ts &&
docker compose --env-file .env.docker up -d --no-deps app
```

`&&` прекращает цепочку при первой ошибке. Пробный запуск ничего не меняет. Если появляется `Ambiguous RAM`, нужно уточнить RAM указанного существующего предложения в админке и повторить запуск. Скрипт не переносит цену между неоднозначными версиями 512 ГБ.

Перед изменениями скрипт сохраняет затронутые карточки и предложения в `/app/backups/catalog-refresh/` внутри отдельного постоянного Docker-тома `catalog_backups`. Эта папка не публикуется сайтом. Заказы, клиенты и секреты в резервную копию не входят и скриптом не изменяются. Старые лишние предложения перемещаются в скрытые архивные карточки, их ID и цены сохраняются.

## Проверка после обновления

1. Телефоны → Samsung → S26 Ultra: сразу сетка памяти/цветов, нет выбора региона.
2. Клавиатуры для iPad: девять карточек, белые и чёрные пары рядом, точная цена без «от».
3. Samsung Galaxy Tab: только восемь моделей; фильтры памяти, цвета и подключения работают.
4. В карточке Tab S11 есть два ракурса, характеристики, совместимая клавиатура и сменный S Pen; A11 не рекомендует S Pen.
5. В сравнении можно найти Samsung Tab, Pixel, Sony, Xiaomi и POCO.
6. Watch7 и OnePlus Watch не видны в меню и каталоге.

Проверены автоматические тесты каталога/разметки и производственная сборка. Скрипт не запускался на серверной базе. Встроенный браузер заблокировал локальный адрес (`ERR_BLOCKED_BY_CLIENT`), поэтому проверка настоящей страницы на настольном и мобильном экране остаётся обязательной после установки. Оригиналы фотографий проверены отдельно.
