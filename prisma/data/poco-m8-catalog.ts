import photos from "./poco-m8-photos.json";
import type {RefreshProduct} from "./catalog-refresh-types";

export const POCO_M8_CATALOG: RefreshProduct[] = ([
  {slug:"poco-m8-5g",name:"POCO M8 5G",sizes:["8/256GB","8/512GB","12/512GB"],chip:"Snapdragon 6 Gen 3",screen:"6,77″ Flow AMOLED, 2392 × 1080, до 120 Гц",battery:"5520 мА·ч",charge:"45 Вт; обратная проводная до 18 Вт",camera:"50 МП Light Fusion 400 + 2 МП датчик глубины",front:"20 МП",sim:"nano-SIM + гибридный слот nano-SIM/microSD; microSD до 1 ТБ",wireless:"NFC, Bluetooth 5.1, Wi-Fi 5",protection:"IP66",weight:"178 г"},
  {slug:"poco-m8-pro-5g",name:"POCO M8 Pro 5G",sizes:["8/256GB","12/512GB"],chip:"Snapdragon 7s Gen 4",screen:"6,83″ CrystalRes AMOLED, 2772 × 1280, до 120 Гц; Dolby Vision",battery:"6500 мА·ч",charge:"100 Вт; обратная проводная до 22,5 Вт",camera:"50 МП Light Fusion 800 с OIS + 8 МП сверхширокоугольная",front:"32 МП",sim:"Две nano-SIM",wireless:"NFC, Bluetooth 5.4, Wi-Fi 6/6E (доступность зависит от региона и ПО)",protection:"IP66/IP68/IP69/IP69K",weight:"205,9 г"},
] as const).map(p=>({
  slug:p.slug,name:p.name,brand:"POCO",category:"telefony",
  description:`${p.name} — смартфон с AMOLED-экраном до 120 Гц и процессором ${p.chip}. Основная камера: ${p.camera}. Аккумулятор ${p.battery}. Выберите память и цвет — каждый вариант показан на отдельной фотографии.`,
  highlights:[p.screen,p.chip,`Аккумулятор ${p.battery}`,`Камера: ${p.camera}`],
  specs:{"Дисплей":p.screen,"Процессор":p.chip,"Основная камера":p.camera,"Фронтальная камера":p.front,"Видео":"До 4K, 30 кадров/с на основную камеру","Память":p.sizes.join(" / "),"Тип памяти":"LPDDR4X / UFS 2.2","Аккумулятор":p.battery,"Зарядка":p.charge,"SIM":p.sim,"Связь":`5G / 4G; ${p.wireless}`,"Защита":`${p.protection}; стойкость снижается при износе, не предназначен для подводной съёмки`,"Вес":p.weight,"Операционная система":"Xiaomi HyperOS 2 (при выпуске)","Комплектация":"Смартфон, кабель USB-C, инструмент SIM, документация; адаптер и чехол зависят от поставки","Важно":"Память, функции связи и комплект уточняйте для выбранного рынка. Мощность зарядки зависит от адаптера и условий."},
  sources:[`https://www.mi.com/global/product/${p.slug}/specs/`],
  variants:p.sizes.flatMap(memory=>Object.entries(photos[p.slug]).map(([color,images])=>({memory,color,region:null,image:images[0],images}))),
}));
