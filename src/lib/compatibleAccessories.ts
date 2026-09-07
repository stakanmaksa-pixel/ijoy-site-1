export type CompatibleAccessoryBundle = {
  eyebrow: string;
  title: string;
  description: string;
  slugs: string[];
};

const IPAD_PRO_SLUGS = new Set([
  "ipad-pro-11-m5",
  "ipad-pro-13-m5",
  "ipad-air-11-m4",
  "ipad-air-13-m4",
  "ipad-mini-a17-pro",
]);

const PS5_SLUGS = new Set([
  "playstation-5-pro",
  "playstation-5-slim-disc-rev2",
  "playstation-5-slim-digital-rev2",
]);

export function getCompatibleAccessoryBundle(productSlug: string): CompatibleAccessoryBundle | null {
  if (IPAD_PRO_SLUGS.has(productSlug)) {
    return {
      eyebrow: "Совместимый аксессуар",
      title: "Купите в комплект Apple Pencil Pro",
      description: "Apple Pencil Pro полностью совместим с этой моделью iPad: поддерживаются наведение, чувствительность к нажатию и наклону, сжатие, вращение пера и магнитная зарядка. Стилус продаётся отдельно.",
      slugs: ["apple-pencil-pro"],
    };
  }
  if (productSlug === "ipad-a16") {
    return {
      eyebrow: "Совместимый аксессуар",
      title: "Купите в комплект Apple Pencil (USB‑C)",
      description: "Apple Pencil (USB‑C) совместим с iPad A16, подходит для заметок, разметки и рисования, крепится магнитом и заряжается через USB‑C. Apple Pencil Pro с iPad A16 не совместим. Стилус продаётся отдельно.",
      slugs: ["apple-pencil-usb-c"],
    };
  }

  if (PS5_SLUGS.has(productSlug)) {
    const isDigital = productSlug === "playstation-5-slim-digital-rev2";
    return {
      eyebrow: "Подходит к этой консоли",
      title: "Дополните PlayStation 5 нужными аксессуарами",
      description: isDigital
        ? "Для PS5 Slim Digital здесь собраны контроллер, гарнитура, PS VR2, Portal и съёмный дисковод. Совместимость дисковода зависит от ревизии консоли — её подтвердит менеджер перед оформлением."
        : "Для этой PS5 можно сразу подобрать дополнительный контроллер, гарнитуру, PS VR2 и PlayStation Portal. Аксессуары приобретаются отдельно.",
      slugs: isDigital
        ? ["dualsense-ps5", "sony-pulse-elite", "playstation-vr2", "playstation-portal-remote-player", "ps5-disc-drive", "dualsense-charging-station"]
        : ["dualsense-ps5", "sony-pulse-elite", "playstation-vr2", "playstation-portal-remote-player", "dualsense-charging-station", "ps5-vertical-stand"],
    };
  }

  if (productSlug === "playstation-portal-remote-player") {
    return {
      eyebrow: "Нужно для работы",
      title: "PlayStation Portal работает вместе с PS5",
      description: "Portal подключается к совместимой PlayStation 5 через Remote Play. PULSE Elite поддерживает беспроводной звук PlayStation Link для PS5 и Portal.",
      slugs: ["playstation-5-pro", "playstation-5-slim-disc-rev2", "playstation-5-slim-digital-rev2", "sony-pulse-elite"],
    };
  }

  if (productSlug === "playstation-vr2") {
    return {
      eyebrow: "Нужно для работы",
      title: "PS VR2 нужна PlayStation 5",
      description: "Гарнитура PS VR2 совместима с PlayStation 5, а дополнительный DualSense пригодится для поддерживаемых игр вне VR.",
      slugs: ["playstation-5-pro", "playstation-5-slim-disc-rev2", "playstation-5-slim-digital-rev2", "dualsense-ps5"],
    };
  }

  if (productSlug === "logitech-g923-racing-wheel" || productSlug === "logitech-g29-racing-wheel") {
    return {
      eyebrow: "Дополнение для автосимуляторов",
      title: "Добавьте коробку передач Driving Force",
      description: "Коробка передач Logitech Driving Force рассчитана на совместимые рули G923, G29 и G920. Перед покупкой уточните платформу вашей версии руля.",
      slugs: ["logitech-driving-force-shifter"],
    };
  }

  if (productSlug === "steam-deck-oled") {
    return {
      eyebrow: "Совместимый аксессуар",
      title: "Добавьте док-станцию для Steam Deck",
      description: "Док-станция позволяет подключить Steam Deck к внешнему дисплею, проводной сети и периферийным устройствам.",
      slugs: ["steam-deck-docking-station"],
    };
  }

  return null;
}
