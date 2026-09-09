import options from "./google-pixel-options.json";
import type { RefreshProduct } from "./catalog-refresh-types";
const rows = [
  ["google-pixel-11", "Google Pixel 11", "6,3″ Actua OLED, 60–120 Гц", "1080 × 2424", "Google Tensor G6", "12 ГБ", "4985 мА·ч", "48 + 13 + 10,8 Мп; телефото 5×", "pixel_11"],
  ["google-pixel-11-pro", "Google Pixel 11 Pro", "6,3″ Super Actua LTPO OLED, 1–120 Гц", "1280 × 2856", "Google Tensor G6", "12 ГБ (256 ГБ), 16 ГБ (512 ГБ / 1 ТБ)", "4850 мА·ч", "50 + 48 + 48 Мп; телефото 5×", "pixel_11_pro"],
  ["google-pixel-11-pro-xl", "Google Pixel 11 Pro XL", "6,8″ Super Actua LTPO OLED, 1–120 Гц", "1344 × 2992", "Google Tensor G6", "12 ГБ (256 ГБ), 16 ГБ (512 ГБ / 1 ТБ)", "5115 мА·ч", "50 + 48 + 48 Мп; телефото 5×", "pixel_11_pro"],
  ["google-pixel-11-pro-fold", "Google Pixel 11 Pro Fold", "8″ Super Actua Flex OLED + внешний 6,5″ OLED, 1–120 Гц", "2076 × 2152 внутри; 1080 × 2342 снаружи", "Google Tensor G6", "16 ГБ", "4806 мА·ч", "48 + 10,5 + 10,8 Мп; телефото 5×", "pixel_11_pro_fold"],
  ["google-pixel-10a", "Google Pixel 10a", "6,3″ Actua pOLED, 60–120 Гц", "1080 × 2424", "Google Tensor G4", "8 ГБ", "5100 мА·ч", "48 + 13 Мп", "pixel_10a"],
];
export const GOOGLE_PIXEL_CATALOG: RefreshProduct[] = rows.map(([slug,name,screen,resolution,chip,ram,battery,cameras,source]) => ({
  slug,name,brand:"Google",category:"telefony",
  description:`${name} — смартфон Google с процессором ${chip} и экраном ${screen}. Выберите память и цвет. Представлены заводские разблокированные версии; региональные возможности связи уточняйте перед покупкой.`,
  highlights:[screen,chip,`Аккумулятор ${battery}`,"Обновления ОС и безопасности в течение 7 лет с начала продаж"],
  specs:{"Дисплей":screen,"Разрешение":resolution,"Процессор":chip,"Оперативная память":ram,"Основная камера":cameras,"Аккумулятор":battery,"Зарядка":slug.endsWith("10a")?"USB‑C и беспроводная Qi; адаптер отдельно":"USB‑C и Pixelsnap Qi2.2 до 25 Вт; адаптер отдельно","Защита":"IP68","SIM":"Формат SIM, eSIM и частоты зависят от поставки; подтвердите совместимость с оператором перед покупкой","Обновления":"7 лет обновлений ОС и безопасности с начала продаж модели","Важно":"Доступность отдельных функций Google, AI, 5G и eSIM зависит от страны, языка и оператора","Комплектация":"Смартфон, USB‑C кабель, документация; адаптер питания отдельно"},
  sources:[`https://store.google.com/product/${source}_specs?hl=en-US`,`https://store.google.com/us/config/${source}?hl=en-US`],
  variants:options.filter(o=>o.slug===slug).map(({memory,color,region,image})=>({memory,color,region,image})),
}));
