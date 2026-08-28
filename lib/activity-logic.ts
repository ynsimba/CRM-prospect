import { ActivityType, TaskStatus } from "@prisma/client";

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CALL: "Appel",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  MEETING: "Rendez-vous",
  VISIT: "Visite",
  DEMO: "Démo",
  NOTE: "Note",
  OTHER: "Autre",
};

export const CONTACT_ACTIVITY_TYPES: ActivityType[] = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "SMS",
  "MEETING",
  "VISIT",
  "DEMO",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "À faire",
  IN_PROGRESS: "En cours",
  DONE: "Terminée",
  CANCELLED: "Annulée",
};

export function taskStatusPill(status: TaskStatus) {
  if (status === "DONE") return "on";
  if (status === "CANCELLED") return "off";
  if (status === "IN_PROGRESS") return "warn";
  return "warn";
}

export function nextTaskStatus(status: TaskStatus): TaskStatus | null {
  if (status === "TODO") return "IN_PROGRESS";
  if (status === "IN_PROGRESS") return "DONE";
  return null;
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function endOfDay(date: Date) {
  const copy = startOfDay(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function followUpBucket(dueAt: Date, today = startOfDay(new Date())): "overdue" | "today" | "upcoming" {
  const due = startOfDay(dueAt).getTime();
  const now = today.getTime();
  if (due < now) return "overdue";
  if (due === now) return "today";
  return "upcoming";
}

export function monthGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<number | null> = [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function parseYearMonth(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return { year, monthIndex: month - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), monthIndex: now.getMonth() };
}

export function isContactActivity(type: ActivityType) {
  return CONTACT_ACTIVITY_TYPES.includes(type);
}
