"use client";

import { useRef } from "react";

// Простой WYSIWYG на contentEditable + execCommand — без внешних зависимостей.
// Для более сложного редактирования можно будет заменить на TipTap/Lexical позже.
export function RichTextEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const editableRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);

  function sync() {
    if (editableRef.current && hiddenRef.current) {
      hiddenRef.current.value = editableRef.current.innerHTML;
    }
  }

  function exec(command: string, value?: string) {
    editableRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function insertLink() {
    const url = window.prompt("Ссылка (URL):");
    if (url) exec("createLink", url);
  }

  function insertImage() {
    const url = window.prompt("Ссылка на изображение (URL):");
    if (url) exec("insertImage", url);
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1 rounded-lg border border-zinc-300 bg-zinc-50 p-1">
        <ToolbarButton onClick={() => exec("bold")}>B</ToolbarButton>
        <ToolbarButton onClick={() => exec("italic")}>I</ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "h2")}>H2</ToolbarButton>
        <ToolbarButton onClick={() => exec("formatBlock", "p")}>P</ToolbarButton>
        <ToolbarButton onClick={() => exec("insertUnorderedList")}>• Список</ToolbarButton>
        <ToolbarButton onClick={insertLink}>Ссылка</ToolbarButton>
        <ToolbarButton onClick={insertImage}>Картинка</ToolbarButton>
      </div>

      <div
        ref={editableRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        className="min-h-[240px] rounded-lg border border-zinc-300 px-3 py-2 text-sm leading-6 focus:outline-none"
      />

      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200"
    >
      {children}
    </button>
  );
}
