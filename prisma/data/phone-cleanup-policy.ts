// Only the seven older models explicitly shown by the user, not whole brands.
export const OLD_SCREENSHOT_PHONES = [
  {slug:"xiaomi-15-ultra",name:"Xiaomi 15 Ultra",brand:"Xiaomi",successor:"Xiaomi 17 Ultra"},
  {slug:"xiaomi-15t",name:"Xiaomi 15T",brand:"Xiaomi",successor:"Xiaomi 17T"},
  {slug:"xiaomi-15t-pro",name:"Xiaomi 15T Pro",brand:"Xiaomi",successor:"Xiaomi 17T Pro"},
  {slug:"redmi-15",name:"REDMI 15",brand:"Xiaomi",successor:"REDMI 17"},
  {slug:"redmi-15-5g",name:"REDMI 15 5G",brand:"Xiaomi",successor:"REDMI 17 5G"},
  {slug:"redmi-note-14",name:"Redmi Note 14",brand:"Xiaomi",successor:"REDMI Note 15"},
  {slug:"poco-x7-pro",name:"POCO X7 Pro",brand:"POCO",successor:"POCO X8 Pro"},
] as const;

export function shouldHideOldScreenshotPhone(p:{slug:string;name:string;brand:string|null;category:{slug:string}}):boolean{
  if(p.category.slug!=="telefony")return false;
  return OLD_SCREENSHOT_PHONES.some(old=>p.brand?.toLowerCase()===old.brand.toLowerCase()&&
    (p.slug===old.slug||p.slug===`xiaomi-${old.slug}`||p.name.trim().toLowerCase()===old.name.toLowerCase()));
}
