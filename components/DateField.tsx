"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  WEEKDAY_LETTERS,
  calendarCells,
  combineDateTime,
  datePart,
  formatDateDisplay,
  monthTitle,
  shiftMonth,
  timePart,
  todayIso,
  viewFromValue,
} from "@/lib/calendar-logic";

const CLOSE_EVENT = "safecheck-close-date";

type DateFieldProps = {
  name: string;
  defaultValue?: string;
  includeTime?: boolean;
  required?: boolean;
  className?: string;
  variant?: "field" | "cell";
  ariaLabel?: string;
  placeholder?: string;
  submitOnChange?: boolean;
  onChange?: (value: string) => void;
};

export default function DateField({
  name,
  defaultValue = "",
  includeTime = false,
  required,
  className,
  variant = "field",
  ariaLabel,
  placeholder = "jj/mm/aaaa",
  submitOnChange,
  onChange,
}: DateFieldProps) {
  const pickerId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const selected = datePart(value);
  const [time, setTime] = useState(timePart(defaultValue));
  const initialView = viewFromValue(defaultValue);
  const [year, setYear] = useState(initialView.year);
  const [monthIndex, setMonthIndex] = useState(initialView.monthIndex);

  useEffect(() => {
    function onClose(event: Event) {
      if ((event as CustomEvent<string>).detail !== pickerId) setOpen(false);
    }
    window.addEventListener(CLOSE_EVENT, onClose);
    return () => window.removeEventListener(CLOSE_EVENT, onClose);
  }, [pickerId]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function commit(nextDate: string, nextTime = time) {
    const next = includeTime ? combineDateTime(nextDate, nextTime || "09:00") : nextDate;
    setValue(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
    onChange?.(next);
    if (submitOnChange) {
      hiddenRef.current?.form?.requestSubmit();
    }
  }

  function openPicker() {
    const view = viewFromValue(value);
    setYear(view.year);
    setMonthIndex(view.monthIndex);
    window.dispatchEvent(new CustomEvent(CLOSE_EVENT, { detail: pickerId }));
    setOpen(true);
  }

  function selectDay(key: string) {
    commit(key);
    setOpen(false);
  }

  function goMonth(delta: number) {
    const next = shiftMonth(year, monthIndex, delta);
    setYear(next.year);
    setMonthIndex(next.monthIndex);
  }

  const today = todayIso();
  const display = formatDateDisplay(value);
  const cells = calendarCells(year, monthIndex);

  return (
    <div
      ref={rootRef}
      className={`date-field${variant === "cell" ? " is-cell" : ""}${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
    >
      <input ref={hiddenRef} type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        className="date-field-trigger"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        {display || <span className="date-field-placeholder">{placeholder}</span>}
      </button>
      <i className="bi bi-calendar3" aria-hidden />
      {open ? (
        <div className="cal-pop" role="dialog" aria-label="Choisir une date">
          <div className="cal-pop-head">
            <strong>{monthTitle(year, monthIndex)}</strong>
            <div className="cal-pop-nav">
              <button type="button" aria-label="Mois précédent" onClick={() => goMonth(-1)}>
                <i className="bi bi-chevron-up" aria-hidden />
              </button>
              <button type="button" aria-label="Mois suivant" onClick={() => goMonth(1)}>
                <i className="bi bi-chevron-down" aria-hidden />
              </button>
            </div>
          </div>
          <div className="cal-pop-week">
            {WEEKDAY_LETTERS.map((letter, index) => (
              <span key={`${letter}-${index}`}>{letter}</span>
            ))}
          </div>
          <div className="cal-pop-grid">
            {cells.map((cell) => {
              const isSelected = cell.key === selected;
              const isToday = cell.key === today;
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={`cal-pop-day${cell.inMonth ? "" : " is-muted"}${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}`}
                  onClick={() => selectDay(cell.key)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          {includeTime ? (
            <label className="cal-pop-time">
              Heure
              <input
                type="time"
                value={time}
                onChange={(event) => {
                  const nextTime = event.target.value;
                  setTime(nextTime);
                  if (selected) commit(selected, nextTime);
                }}
              />
            </label>
          ) : null}
          <div className="cal-pop-foot">
            <button
              type="button"
              onClick={() => {
                setValue("");
                setTime("");
                if (hiddenRef.current) hiddenRef.current.value = "";
                onChange?.("");
                if (submitOnChange) hiddenRef.current?.form?.requestSubmit();
                setOpen(false);
              }}
            >
              Effacer
            </button>
            <button
              type="button"
              onClick={() => {
                const view = viewFromValue(today);
                setYear(view.year);
                setMonthIndex(view.monthIndex);
                selectDay(today);
              }}
            >
              Aujourd’hui
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
