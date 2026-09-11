import type { VariantImageSelector } from "../../src/lib/pickCoverImage";

const sony = (name: string) => `https://gmedia.playstation.com/is/image/SIEPDC/${name}?fmt=png-alpha&wid=1000`;
const blog = (name: string) => `https://blog.playstation.com/tachyon/${name}`;
export const ACCESSORY_PHOTOS = {
  "dualsense-ps5": {
    White: sony("dualsense-controller-image-block-01-ps5-26jun20"),
    Black: sony("dualsense-midnight-black-screenshot-04-en-08dec21"),
    "Chroma Indigo": sony("dualsense-indigo-screenshot-01-en-23sep24"),
    "Volcanic Red": sony("dualsense-volcanic-red-screenshot-01-en-04sep23"),
    "Cobalt Blue": sony("dualsense-cobalt-blue-screenshot-01-en-04sep23"),
    Blue: sony("dualsense-starlight-blue-screenshot-01-en-30nov21"),
    Red: sony("dualsense-cosmic-red-screenshot-04-en-08dec21"),
    Purple: sony("dualsense-galactic-purple-screenshot-01-en-30nov21"),
    Camo: sony("dualsense-gray-camo-screenshot-01-en-13sep22"),
    Pink: sony("dualsense-nova-pink-screenshot-01-en-30nov21"),
    "Sterling Silver": sony("dualsense-sterling-silver-screenshot-01-en-04sep23"),
  },
  "dualsense-limited-editions": {
    Marathon: sony("Marathon-LE-DualSense-image-block-02-en-12jan26"),
    "Icon Blue": blog("2025/10/1008a1f5f5203825a42368366590a506a5a8e957-scaled.jpg"),
    "Remix Green": sony("dualsense-remix-green-screenshot-01-en-07jan26"),
    "Techno Red": sony("dualsense-techno-red-screenshot-01-en-07jan26"),
    "Rhythm Blue": sony("dualsense-rhythm-blue-screenshot-01-en-07jan26"),
    "30th Anniversary": sony("30th-dualsense-controller-image-block-02-en-11sep24"),
    "Genshin Impact": sony("Genshin-Impact-LE-DualSense-image-block-02-en-20nov25"),
    Fortnite: blog("2024/09/612bbb54640ead8c32c5c72d56184d21db599f80.jpg"),
    "God of War 20th Anniversary": sony("god-of-war-20th-dualsense-image-block-01-en-07may25"),
    "Ghost of Yotei": sony("Ghost-of-Yotei-LE-controller-black-image-block-01-03jul25"),
    "The Last of Us": blog("2025/03/dc4c663c5da554c9c3afb91c1f2a6284cfc7e3e4-scaled.jpeg"),
    "James Bond 007": sony("007-First-Light-LE-DualSense-image-block-01-en-02apr26"),
    "Monster Hunter": sony("dualsense-monster-hunter-wilds-limited-edition-01-24oct24"),
  },
  "google-fitbit-air": {
    Berry: "https://lh3.googleusercontent.com/RROrWEmYrubV9fdSohP-eAkZWq__P5wr_KZYZocpzTkJMMxpynQvRdWOosnrsDCrS4H1GjcJrm_a6OMcfyk8ClhV88hr3e55zbA=w1000-rw",
    Fog: "https://lh3.googleusercontent.com/MK3lo1_EyBfuA3yo0EPW2Lor9OAwATprEn5N5dn1s7-Bjh5hNm8-7OfP9txJIcWNABjb1yHxPnIDT3uXHx4MZCLzIyf4c0FSwNRX=w1000-rw",
    Lavender: "https://lh3.googleusercontent.com/EDl1ee4HsTGxLBk9nAylncDr1bOTsO1sBCG5oiMHD2Rhukt0mYXl-uY9EMCIfGeJN_NWyqP4lyf-bD3av_rNIozA3EitrExeowx7=w1000-rw",
    Obsidian: "https://lh3.googleusercontent.com/z8SXshvQrmNukAoE3Hwqdhicp6dItMLxn1J5H9V-dSx9bM3HVjirK6oZVoKWthOQJAqFAJ3jdJgnbtv5wbO9c_U4RsZfx_M-owa0=w1000-rw",
    "Stephen Curry Edition": "https://lh3.googleusercontent.com/huhlM44tJAEupp55VtChV638F_cCpMSyTtA0vPwRtOHIZJuomt9CbR7GPcC-FkovYAPr8Bl_yir_c8ljBgIDPyVYUkaq3O4YkNZ2=w1000-rw",
  },
} satisfies Record<string, Record<string, string>>;

export function accessoryPhotoPath(slug: string, key: string): string {
  const source = (ACCESSORY_PHOTOS as Record<string, Record<string, string>>)[slug]?.[key];
  if (!source) throw Error(`Нет проверенного фото: ${slug} / ${key}`);
  const ext = source.includes("gmedia.playstation.com") ? "png" : source.includes("googleusercontent.com") ? "webp" : new URL(source).pathname.split(".").pop();
  return `/catalog/product-photos/accessory-variants/${slug}/${key.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${ext}`;
}

export function accessoryVariantPhoto(slug: string, variant: VariantImageSelector): string | null {
  if (!(slug in ACCESSORY_PHOTOS)) return null;
  const key = slug === "dualsense-limited-editions" ? variant.memory
    : slug === "google-fitbit-air" && variant.memory === "Stephen Curry Edition" ? variant.memory : variant.color;
  if (!key) throw Error(`Нет ключа фото: ${slug}`);
  return accessoryPhotoPath(slug, key);
}
