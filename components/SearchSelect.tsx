"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Option = { id: string; name: string };

type SearchSelectProps = {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string;
  emptyLabel?: string;
  allowEmpty?: boolean;
  searchPlaceholder?: string;
};

export default function SearchSelect({
  name,
  label,
  options,
  defaultValue = "",
  emptyLabel = "Aucune",
  allowEmpty = true,
  searchPlaceholder = "Rechercher une option",
}: SearchSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(defaultValue);
  const selected = options.find((item) => item.id === value);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((item) => item.name.toLowerCase().includes(needle));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    setValue(next);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="login-field search-select" ref={rootRef}>
      <span id={`${id}-label`}>{label}</span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className={`search-select-trigger ${open ? "is-open" : ""}`}
        aria-labelledby={`${id}-label`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.name ?? (allowEmpty ? emptyLabel : "")}</span>
        <i className="bi bi-chevron-down" aria-hidden />
      </button>
      {open ? (
        <div className="search-select-panel" role="listbox" aria-labelledby={`${id}-label`}>
          <input
            ref={searchRef}
            type="search"
            className="search-select-query"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={searchPlaceholder}
          />
          <div className="search-select-options">
            {allowEmpty ? (
              <button type="button" className="search-select-pill" role="option" aria-selected={value === ""} onClick={() => choose("")}>
                {emptyLabel}
              </button>
            ) : null}
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`search-select-pill ${item.id === value ? "is-selected" : ""}`}
                role="option"
                aria-selected={item.id === value}
                onClick={() => choose(item.id)}
              >
                {item.name}
              </button>
            ))}
            {filtered.length === 0 ? <p className="search-select-empty">Aucune option</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
