"use client";

import { useRef } from "react";

export function CatalogAutoForm({ children }: { children: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  function submitIfChoice(target: HTMLInputElement | HTMLSelectElement) {
    if (target.name === "category") {
      formRef.current?.querySelectorAll<HTMLInputElement>('input[name="brand"], input[name="product"], input[name="memory"], input[name="color"], input[name="region"], input[name="inStock"]').forEach((input) => { input.checked = false; });
    }
    if (target.type === "number" || target.tagName === "TEXTAREA") return;
    formRef.current?.requestSubmit();
  }
  return <form ref={formRef} method="get" onChange={(event) => submitIfChoice(event.target as unknown as HTMLInputElement | HTMLSelectElement)} onBlur={(event) => { if ((event.target as unknown as HTMLInputElement).type === "number") formRef.current?.requestSubmit(); }} className="flex flex-col gap-6">{children}</form>;
}
