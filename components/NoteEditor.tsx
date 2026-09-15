"use client";

import { useEffect, useRef } from "react";

const TOOLS = [
  { cmd: "bold", icon: "bi-type-bold", label: "Gras" },
  { cmd: "italic", icon: "bi-type-italic", label: "Italique" },
  { cmd: "underline", icon: "bi-type-underline", label: "Souligné" },
  { cmd: "insertUnorderedList", icon: "bi-list-ul", label: "Liste" },
  { cmd: "insertOrderedList", icon: "bi-list-ol", label: "Liste numérotée" },
] as const;

type NoteEditorProps = {
  name?: string;
  defaultValue?: string;
  onChange?: (html: string) => void;
};

export default function NoteEditor({ name = "body", defaultValue = "", onChange }: NoteEditorProps) {
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
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    sync();
  }

  function addHeading() {
    run("formatBlock", "h2");
  }

  function addQuote() {
    run("formatBlock", "blockquote");
  }

  function addLink() {
    const href = window.prompt("Lien (https://…)");
    if (!href?.trim()) return;
    run("createLink", href.trim());
  }

  return (
    <div className="note-editor">
      <div className="note-toolbar" role="toolbar" aria-label="Mise en forme">
        {TOOLS.map((tool) => (
          <button
            key={tool.cmd}
            type="button"
            className="note-tool"
            title={tool.label}
            aria-label={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(tool.cmd)}
          >
            <i className={`bi ${tool.icon}`} aria-hidden />
          </button>
        ))}
        <button
          type="button"
          className="note-tool"
          title="Titre"
          aria-label="Titre"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addHeading}
        >
          <i className="bi bi-type-h2" aria-hidden />
        </button>
        <button
          type="button"
          className="note-tool"
          title="Citation"
          aria-label="Citation"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addQuote}
        >
          <i className="bi bi-quote" aria-hidden />
        </button>
        <button
          type="button"
          className="note-tool"
          title="Lien"
          aria-label="Lien"
          onMouseDown={(event) => event.preventDefault()}
          onClick={addLink}
        >
          <i className="bi bi-link-45deg" aria-hidden />
        </button>
      </div>
      <div
        ref={editorRef}
        className="note-canvas"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de la note"
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
      />
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
