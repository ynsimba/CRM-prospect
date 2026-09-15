export const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export const MONTH_LABELS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

export type CalendarCell = {
  key: string;
  day: number;
  inMonth: boolean;
};

export function isoDate(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayIso(now = new Date()) {
  return isoDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function monthTitle(year: number, monthIndex: number) {
  return `${MONTH_LABELS_FR[monthIndex]} ${year}`;
}

export function calendarCells(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, monthIndex, 1 - mondayOffset);
  const cells: CalendarCell[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    cells.push({
      key: isoDate(date.getFullYear(), date.getMonth(), date.getDate()),
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
    });
  }
  if (cells.slice(35).every((cell) => !cell.inMonth)) return cells.slice(0, 35);
  return cells;
}

export function datePart(value?: string) {
  const part = value?.slice(0, 10) ?? "";
  return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : "";
}

export function timePart(value?: string) {
  const match = value?.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

export function combineDateTime(date: string, time?: string) {
  if (!date) return "";
  return time ? `${date}T${time}` : date;
}

export function formatDateDisplay(value?: string) {
  const part = datePart(value);
  if (!part) return "";
  const [year, month, day] = part.split("-");
  return `${day}/${month}/${year}`;
}

export function viewFromValue(value?: string, now = new Date()) {
  const part = datePart(value);
  if (part) {
    const [year, month] = part.split("-").map(Number);
    return { year, monthIndex: month - 1 };
  }
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}
