import photos from "./xiaomi-phone-photos.json";
import type { RefreshProduct } from "./catalog-refresh-types";
type Phone = {slug:string; name:string; sizes:string[]; colors:string[]; chip:string; screen:string; battery:string; charging:string; network:string; source?:string};
const phones: Phone[] = [
  {slug:"poco-c81-pro",name:"POCO C81 Pro",sizes:["4/64GB","4/128GB","4/256GB"],colors:["Black","Gold","Green"],chip:"UNISOC T7250",screen:"6,9″ LCD, 1600 × 720, до 120 Гц",battery:"6000 мА·ч",charging:"15 Вт",network:"4G LTE"},
  {slug:"poco-x8-pro",name:"POCO X8 Pro",sizes:["8/256GB","8/512GB","12/512GB"],colors:["Black","Mint Green","White","Yellow"],chip:"MediaTek Dimensity 8500-Ultra",screen:"6,59″ AMOLED, 2756 × 1268, до 120 Гц",battery:"6500 мА·ч",charging:"100 Вт",network:"5G"},
  {slug:"poco-x8-pro-max",name:"POCO X8 Pro Max",sizes:["12/256GB","12/512GB"],colors:["Orange","Blue","White","Black"],chip:"MediaTek Dimensity 9500s",screen:"6,83″ AMOLED, 2772 × 1280, до 120 Гц",battery:"8500 мА·ч",charging:"100 Вт",network:"5G"},
  {slug:"poco-f8-pro",name:"POCO F8 Pro",sizes:["12/256GB","12/512GB"],colors:["Black","Titanium Silver","Blue"],chip:"Snapdragon 8 Elite",screen:"6,59″ AMOLED, 2510 × 1156, до 120 Гц",battery:"6210 мА·ч",charging:"100 Вт",network:"5G"},
  {slug:"poco-f8-ultra",name:"POCO F8 Ultra",sizes:["12/256GB","16/512GB"],colors:["Denim Blue","Black"],chip:"Snapdragon 8 Elite Gen 5",screen:"6,9″ AMOLED, 2608 × 1200, до 120 Гц",battery:"6500 мА·ч",charging:"100 Вт по проводу, 50 Вт беспроводная",network:"5G"},
  {slug:"poco-f9-ultra",name:"POCO F9 Ultra",sizes:["12/256GB","16/512GB","16/1TB"],colors:["Black","Red"],chip:"Snapdragon 8 Elite Gen 5, VisionBoost D8",screen:"6,9″ AMOLED, до 185 Гц в поддерживаемых режимах",battery:"8050 мА·ч",charging:"100 Вт по проводу, 50 Вт беспроводная",network:"5G",source:"https://www.mi.com/es/product/poco-f9-ultra/specs/"},
  {slug:"xiaomi-17",name:"Xiaomi 17",sizes:["12/256GB","12/512GB"],colors:["Alpine Pink","Ice Blue","Black","Venture Green"],chip:"Snapdragon 8 Elite Gen 5",screen:"6,3″ OLED, 2656 × 1220, 1–120 Гц",battery:"6330 мА·ч",charging:"100 Вт по проводу, 50 Вт беспроводная",network:"5G"},
  {slug:"xiaomi-17-ultra",name:"Xiaomi 17 Ultra",sizes:["16/512GB","16/1TB"],colors:["Black","White","Starlit Green"],chip:"Snapdragon 8 Elite Gen 5",screen:"6,9″ HyperRGB OLED, 2608 × 1200, 1–120 Гц",battery:"6000 мА·ч",charging:"90 Вт по проводу, 50 Вт беспроводная",network:"5G"},
  {slug:"xiaomi-17t",name:"Xiaomi 17T",sizes:["12/256GB","12/512GB"],colors:["Black","Opal White","Blue","Violet"],chip:"MediaTek Dimensity 8500-Ultra",screen:"6,59″ AMOLED, 2756 × 1268, до 120 Гц",battery:"6500 мА·ч",charging:"67 Вт",network:"5G"},
  {slug:"xiaomi-17t-pro",name:"Xiaomi 17T Pro",sizes:["12/256GB","12/512GB","12/1TB"],colors:["Black","Deep Violet","Deep Blue"],chip:"MediaTek Dimensity 9500",screen:"6,83″ AMOLED, 2772 × 1280, до 144 Гц",battery:"7000 мА·ч",charging:"100 Вт по проводу, 50 Вт беспроводная",network:"5G"},
  {slug:"redmi-note-15",name:"REDMI Note 15",sizes:["6/128GB","8/128GB","8/256GB","8/512GB"],colors:["Black","Glacier Blue","Purple","Forest Green"],chip:"MediaTek Helio G100-Ultra",screen:"6,77″ AMOLED, 2392 × 1080, до 120 Гц",battery:"6000 мА·ч",charging:"33 Вт",network:"4G LTE"},
  {slug:"redmi-note-15-5g",name:"REDMI Note 15 5G",sizes:["6/128GB","8/256GB","8/512GB","12/512GB"],colors:["Black","Glacier Blue","Mist Purple"],chip:"Snapdragon 6 Gen 3",screen:"6,67″ AMOLED, 2392 × 1080, до 120 Гц",battery:"5520 мА·ч",charging:"45 Вт",network:"5G"},
  {slug:"redmi-note-15-pro",name:"REDMI Note 15 Pro",sizes:["8/256GB","12/256GB","12/512GB"],colors:["Black","Glacier Blue","Titanium Color"],chip:"MediaTek Helio G200-Ultra",screen:"6,77″ AMOLED, 2392 × 1080, до 120 Гц",battery:"6500 мА·ч",charging:"45 Вт",network:"4G LTE"},
  {slug:"redmi-note-15-pro-5g",name:"REDMI Note 15 Pro 5G",sizes:["8/256GB","8/512GB","12/256GB","12/512GB"],colors:["Black","Glacier Blue","Titanium Color","Mist Purple"],chip:"MediaTek Dimensity 7400-Ultra",screen:"6,83″ AMOLED, 2772 × 1280, до 120 Гц",battery:"6580 мА·ч",charging:"45 Вт",network:"5G"},
  {slug:"redmi-note-15-pro-plus-5g",name:"REDMI Note 15 Pro+ 5G",sizes:["8/256GB","12/256GB","12/512GB"],colors:["Black","Glacier Blue","Mocha Brown"],chip:"Snapdragon 7s Gen 4",screen:"6,83″ AMOLED, 2772 × 1280, до 120 Гц",battery:"6500 мА·ч",charging:"100 Вт",network:"5G"},
];
export const XIAOMI_PHONE_CATALOG: RefreshProduct[] = phones.map(p=>({
  slug:p.slug,name:p.name,brand:p.slug.startsWith("poco-")?"POCO":"Xiaomi",category:"telefony",
  aliases:p.slug.startsWith("redmi-")?[`xiaomi-${p.slug}`]:[],
  description:`${p.name} — смартфон с процессором ${p.chip}, экраном ${p.screen} и аккумулятором ${p.battery}. Выберите объём оперативной и встроенной памяти и цвет. Для каждой расцветки показаны отдельные фотографии устройства.`,
  highlights:[p.screen,p.chip,`Аккумулятор ${p.battery}; зарядка до ${p.charging}`,`Подключение ${p.network}`],
  specs:{"Дисплей":p.screen,"Процессор":p.chip,"Память":p.sizes.join(" / "),"Обозначение памяти":"Первое число — оперативная память (ГБ), второе — накопитель","Аккумулятор":p.battery,"Зарядка":`До ${p.charging}; доступная мощность зависит от зарядного устройства и условий`,"Сотовая связь":p.network,"Цвета":p.colors.join(", "),"SIM":"Формат SIM, поддержка eSIM и частоты зависят от региональной поставки; уточняйте перед покупкой","Комплектация":"Смартфон и документация; наличие кабеля, адаптера питания и чехла зависит от поставки","Важно":"Характеристики указаны для официальной международной версии. Доступность цветов, памяти и отдельных функций зависит от рынка"},
  sources:[p.source??`https://www.mi.com/global/product/${p.slug}/specs/`],
  variants:p.sizes.flatMap(memory=>p.colors.map(color=>{
    const gallery=(photos as Record<string,Record<string,string[]>>)[p.slug]?.[color];
    if(!gallery?.length)throw new Error(`Missing color photo: ${p.slug} / ${color}`);
    return {memory,color,region:null,image:gallery[0],images:gallery};
  })),
}));
