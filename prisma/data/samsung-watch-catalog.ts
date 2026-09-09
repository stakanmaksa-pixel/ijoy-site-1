import type { RefreshProduct } from "./catalog-refresh-types";
export const SAMSUNG_WATCH_CATALOG: RefreshProduct[] = [
  {
    slug:"samsung-galaxy-watch-9",name:"Samsung Galaxy Watch9",brand:"Samsung",category:"chasy",
    aliases:["samsung-galaxy-watch9","galaxy-watch9"],
    description:"Samsung Galaxy Watch9 — часы для уведомлений, тренировок и отслеживания повседневной активности. Корпус 40 мм доступен в Graphite и Cream, 44 мм — в Graphite и Silver. Выберите Bluetooth или LTE.",
    highlights:["Super AMOLED с яркостью до 3000 нит","Snapdragon Wear Elite, 2 ГБ оперативной и 32 ГБ встроенной памяти","Корпус 40 или 44 мм","Тренировки, пульс и наблюдение за сном"],
    specs:{"Дисплей":"40 мм: 1,34″ Super AMOLED; 44 мм: 1,47″ Super AMOLED","Разрешение":"438 × 438 (40 мм); 480 × 480 (44 мм)","Процессор":"Snapdragon Wear Elite","Оперативная память":"2 ГБ","Накопитель":"32 ГБ","Аккумулятор":"390 мА·ч (40 мм), 445 мА·ч (44 мм)","Автономность":"До 40 часов без Always On Display; фактическое время зависит от использования","Корпус":"Алюминий","Защита":"5 ATM / IP68","Операционная система":"Wear OS 7, One UI Watch 9","Подключение":"Bluetooth или LTE/eSIM; мобильный тариф приобретается отдельно","Совместимость":"Android 13 и новее; отдельным функциям требуется смартфон Samsung Galaxy","Важно":"Не медицинский прибор. Функции здоровья, LTE и eSIM зависят от страны, смартфона и оператора","Комплектация":"Часы, Sport Band, беспроводное зарядное устройство; размер ремешка уточните при заказе"},
    sources:["https://www.samsung.com/uk/watches/galaxy-watch9/buy/","https://news.samsung.com/uk/samsung-galaxy-watch-ultra2-and-watch9-your-health-companion-on-the-wrist"],
    variants:[{memory:"40mm",colors:["Graphite","Cream"]},{memory:"44mm",colors:["Graphite","Silver"]}].flatMap(({memory,colors})=>colors.flatMap(color=>["Bluetooth","LTE"].map(region=>({memory,color,region,image:`/catalog/product-photos/samsung-watches/watch9-${memory.slice(0,2)}-${color.toLowerCase()}.png` })))),
  },
  {
    slug:"samsung-galaxy-watch-ultra-2",name:"Samsung Galaxy Watch Ultra2",brand:"Samsung",category:"chasy",aliases:["samsung-galaxy-watch-ultra2","galaxy-watch-ultra2"],
    description:"Samsung Galaxy Watch Ultra2 — часы в титановом корпусе 47 мм для тренировок и активного отдыха. Доступны Titanium Gray и Titanium Silver, с подключением LTE. Поддержку eSIM вашего оператора уточняйте перед покупкой.",
    highlights:["1,52″ Super AMOLED, до 5000 нит","Титановый корпус 47 мм","Аккумулятор 800 мА·ч","Snapdragon Wear Elite и LTE"],
    specs:{"Дисплей":"1,52″ Super AMOLED","Разрешение":"498 × 498","Процессор":"Snapdragon Wear Elite","Оперативная память":"2 ГБ","Накопитель":"64 ГБ","Аккумулятор":"800 мА·ч","Автономность":"До 80 часов без Always On Display; до 60 часов с AOD, зависит от условий","Корпус":"Титан, 47 мм","Размеры":"47,4 × 47,1 × 10,7 мм","Вес":"61,5 г без ремешка","Защита":"10 ATM / IP69K","Операционная система":"Wear OS 7, One UI Watch 9","Подключение":"Bluetooth и LTE/eSIM; тариф отдельно","Совместимость":"Android 13 и новее; отдельным функциям требуется Samsung Galaxy","Важно":"Не медицинский прибор. Не все функции здоровья и eSIM доступны во всех странах; соблюдайте ограничения производителя при использовании в воде","Комплектация":"Часы, ремешок, беспроводное зарядное устройство; тип и размер ремешка уточняйте при заказе"},
    sources:["https://news.samsung.com/au/samsung-galaxy-watch-ultra2-and-watch9-life-companion-on-your-wrist-for-your-healthier-living","https://www.samsung.com/in/watches/galaxy-watch/galaxy-watch-ultra2-titanium-gray-lte-sm-l715fzkains/buy/"],
    variants:["Gray","Silver"].map(color=>({memory:"47mm",color:`Titanium ${color}`,region:"LTE",image:`/catalog/product-photos/samsung-watches/ultra2-${color.toLowerCase()}.png`})),
  },
];
