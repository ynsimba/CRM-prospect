"use client";

import { useEffect, useRef } from "react";
import { NOTE_FONTS, NOTE_FONT_SIZES } from "@/lib/notes-logic";

const TEXT_TOOLS = [
  { cmd: "bold", icon: "bi-type-bold", label: "Gras" },
  { cmd: "italic", icon: "bi-type-italic", label: "Italique" },
  { cmd: "underline", icon: "bi-type-underline", label: "Souligné" },
  { cmd: "strikeThrough", icon: "bi-type-strikethrough", label: "Barré" },
] as const;

const LIST_TOOLS = [
  { cmd: "insertUnorderedList", icon: "bi-list-ul", label: "Liste" },
  { cmd: "insertOrderedList", icon: "bi-list-ol", label: "Liste numérotée" },
] as const;

const ALIGN_TOOLS = [
  { cmd: "justifyLeft", icon: "bi-text-left", label: "Aligner à gauche" },
  { cmd: "justifyCenter", icon: "bi-text-center", label: "Centrer" },
  { cmd: "justifyRight", icon: "bi-text-right", label: "Aligner à droite" },
  { cmd: "justifyFull", icon: "bi-justify", label: "Justifier" },
] as const;

type NoteEditorProps = {
  name?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
};

function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="note-tool"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <i className={`bi ${icon}`} aria-hidden />
    </button>
  );
}

export default function NoteEditor({
  name = "body",
  defaultValue = "",
  onChange,
  readOnly = false,
}: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = defaultValue || "<p></p>";
    }
    if (inputRef.current) {
      inputRef.current.value = defaultValue;
    }
  }, [defaultValue]);

  function sync() {
    const html = editorRef.current?.innerHTML ?? "";
    if (inputRef.current) inputRef.current.value = html;
    onChange?.(html);
  }

  function run(command: string, value?: string) {
    if (readOnly) return;
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function applyFontSize(px: string) {
    if (readOnly) return;
    if (!/^[\d.]+px$/i.test(px)) return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (selection.isCollapsed) {
      document.execCommand("insertHTML", false, `<span style="font-size: ${px}">&#8203;</span>`);
      sync();
      return;
    }

    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = px;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    selection.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(span);
    next.collapse(false);
    selection.addRange(next);
    sync();
  }

  return (
    <div className={`note-editor ${readOnly ? "is-readonly" : ""}`}>
      {readOnly ? null : (
      <div className="note-toolbar" role="toolbar" aria-label="Mise en forme">
        {TEXT_TOOLS.map((tool) => (
          <ToolButton key={tool.cmd} label={tool.label} icon={tool.icon} onClick={() => run(tool.cmd)} />
        ))}

        <span className="note-tool-sep" aria-hidden />

        {LIST_TOOLS.map((tool) => (
          <ToolButton key={tool.cmd} label={tool.label} icon={tool.icon} onClick={() => run(tool.cmd)} />
        ))}
        <ToolButton label="Titre" icon="bi-type-h2" onClick={() => run("formatBlock", "h2")} />
        <ToolButton label="Citation" icon="bi-quote" onClick={() => run("formatBlock", "blockquote")} />
        <ToolButton
          label="Lien"
          icon="bi-link-45deg"
          onClick={() => {
            const href = window.prompt("Lien (https://…)");
            if (!href?.trim()) return;
            run("createLink", href.trim());
          }}
        />

        <span className="note-tool-sep" aria-hidden />

        {ALIGN_TOOLS.map((tool) => (
          <ToolButton key={tool.cmd} label={tool.label} icon={tool.icon} onClick={() => run(tool.cmd)} />
        ))}

        <span className="note-tool-sep" aria-hidden />

        <label className="note-tool-field">
          <span className="visually-hidden">Police</span>
          <select
            className="note-tool-select"
            aria-label="Police"
            defaultValue=""
            onMouseDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              run("fontName", value);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              Police
            </option>
            {NOTE_FONTS.map((font) => (
              <option key={font.label} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <label className="note-tool-field">
          <span className="visually-hidden">Taille</span>
          <select
            className="note-tool-select note-tool-select-size"
            aria-label="Taille du texte"
            defaultValue=""
            onMouseDown={(event) => event.stopPropagation()}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              applyFontSize(value);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              Taille
            </option>
            {NOTE_FONT_SIZES.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </label>

        <label className="note-tool-color" title="Couleur du texte">
          <span className="visually-hidden">Couleur du texte</span>
          <i className="bi bi-paint-bucket" aria-hidden />
          <input
            type="color"
            defaultValue="#1a1a1a"
            aria-label="Couleur du texte"
            onMouseDown={(event) => event.preventDefault()}
            onChange={(event) => run("foreColor", event.target.value)}
          />
        </label>

        <label className="note-tool-color" title="Surlignage">
          <span className="visually-hidden">Surlignage</span>
          <i className="bi bi-highlighter" aria-hidden />
          <input
            type="color"
            defaultValue="#fff3bf"
            aria-label="Couleur de surlignage"
            onMouseDown={(event) => event.preventDefault()}
            onChange={(event) => {
              editorRef.current?.focus();
              const ok = document.execCommand("hiliteColor", false, event.target.value);
              if (!ok) document.execCommand("backColor", false, event.target.value);
              sync();
            }}
          />
        </label>
      </div>
      )}
      <div
        ref={editorRef}
        className="note-canvas"
        contentEditable={!readOnly}
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de la note"
        aria-readonly={readOnly || undefined}
        suppressContentEditableWarning
        onInput={readOnly ? undefined : sync}
        onBlur={readOnly ? undefined : sync}
      />
      {readOnly ? null : (
        <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
      )}
    </div>
  );
}
