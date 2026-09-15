export const RELANCE_MONTHS = 3;
export const DORMANT_MONTHS = 6;
export const DASHBOARD_DORMANT_MONTHS = 2;
export const REJECTED_ARCHIVE_DAYS = 15;
export const FINALIZED_ARCHIVE_DAYS = 30;

export const SAFECHECK_STATUSES = [
  { name: "Opportunité", slug: "opportunite", sortOrder: 0, isConverted: false, isLost: false },
  { name: "Lead", slug: "lead", sortOrder: 1, isConverted: false, isLost: false },
  { name: "Pipeline", slug: "pipeline", sortOrder: 2, isConverted: false, isLost: false },
  { name: "Rejeté", slug: "rejete", sortOrder: 3, isConverted: false, isLost: true },
  { name: "Finalisé", slug: "finalise", sortOrder: 4, isConverted: true, isLost: false },
] as const;

export type SafecheckStatusSlug = (typeof SAFECHECK_STATUSES)[number]["slug"];

export const STATUS_SLUG_MAP: Record<string, SafecheckStatusSlug> = {
  nouveau: "opportunite",
  "a-contacter": "opportunite",
  contacte: "lead",
  reponse: "lead",
  qualifie: "pipeline",
  "en-attente": "pipeline",
  "non-qualifie": "rejete",
  perdu: "rejete",
  converti: "finalise",
  opportunite: "opportunite",
  lead: "lead",
  pipeline: "pipeline",
  rejete: "rejete",
  finalise: "finalise",
};

export function mapStatusSlug(slug: string): SafecheckStatusSlug {
  return STATUS_SLUG_MAP[slug] ?? "opportunite";
}

export function actionAnchor(input: {
  lastActionAt?: Date | null;
  firstContactAt?: Date | null;
  lastContactAt?: Date | null;
  createdAt: Date;
}) {
  return input.lastActionAt ?? input.firstContactAt ?? input.lastContactAt ?? input.createdAt;
}

export function monthsBetween(from: Date, to: Date) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  return months;
}

export function daysBetween(from: Date, to: Date) {
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toDay = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.floor((toDay - fromDay) / 86_400_000);
}

export function daysAgo(now: Date, days: number) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  return date;
}

export function monthsAgo(now: Date, months: number) {
  return new Date(now.getFullYear(), now.getMonth() - months, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
}

export function isTerminalStatus(input: { isConverted?: boolean; isLost?: boolean; slug?: string }) {
  return Boolean(input.isConverted || input.isLost || input.slug === "rejete" || input.slug === "finalise");
}

export function needsRelance(
  input: {
    lastActionAt?: Date | null;
    firstContactAt?: Date | null;
    lastContactAt?: Date | null;
    createdAt: Date;
    isConverted?: boolean;
    isLost?: boolean;
    slug?: string;
  },
  now = new Date(),
) {
  if (isTerminalStatus(input)) return false;
  return monthsBetween(actionAnchor(input), now) >= RELANCE_MONTHS;
}

export function isDormantProspect(
  input: {
    lastActionAt?: Date | null;
    firstContactAt?: Date | null;
    lastContactAt?: Date | null;
    createdAt: Date;
    isConverted?: boolean;
    isLost?: boolean;
    slug?: string;
  },
  now = new Date(),
) {
  if (isTerminalStatus(input)) return false;
  return monthsBetween(actionAnchor(input), now) >= DORMANT_MONTHS;
}

export function isArchivedProspect(
  input: {
    lastActionAt?: Date | null;
    firstContactAt?: Date | null;
    lastContactAt?: Date | null;
    createdAt: Date;
    isConverted?: boolean;
    isLost?: boolean;
    slug?: string;
  },
  now = new Date(),
) {
  const days = daysBetween(actionAnchor(input), now);
  if (input.isLost || input.slug === "rejete") return days >= REJECTED_ARCHIVE_DAYS;
  if (input.isConverted || input.slug === "finalise") return days >= FINALIZED_ARCHIVE_DAYS;
  return false;
}

export function relanceLabel(input: Parameters<typeof needsRelance>[0], now = new Date()) {
  return needsRelance(input, now) ? "⚠️ Relance nécessaire" : "";
}

export function dormantLabel(input: Parameters<typeof isDormantProspect>[0], now = new Date()) {
  return isDormantProspect(input, now) ? "🚨 6 mois sans progression - changer d’approche" : "";
}

export function archivedLabel(input: Parameters<typeof isArchivedProspect>[0], now = new Date()) {
  return isArchivedProspect(input, now) ? "Archivé" : "";
}

export function historySummary(companyName: string, date?: Date | null) {
  if (!date) return companyName;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${companyName} - ${day}/${month}/${date.getFullYear()}`;
}

export function daysRemainingLabel(dueAt: Date | null | undefined, now = new Date()) {
  if (!dueAt) return "";
  const days = daysBetween(now, dueAt);
  if (days < 0) return `⚠ En retard de ${Math.abs(days)} jour(s)`;
  if (days === 0) return "📅 Échéance aujourd’hui";
  return `✅ ${days} jour(s) restant(s)`;
}

export function formatDisplayCode(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function inactivityOr(cutoff: Date) {
  return [
    { lastActionAt: { lte: cutoff } },
    { lastActionAt: null, firstContactAt: { lte: cutoff } },
    { lastActionAt: null, firstContactAt: null, lastContactAt: { lte: cutoff } },
    { lastActionAt: null, firstContactAt: null, lastContactAt: null, createdAt: { lte: cutoff } },
  ];
}

export function dormantWhere(now = new Date(), months = DORMANT_MONTHS) {
  const cutoff = monthsAgo(now, months);
  return {
    status: { isConverted: false, isLost: false },
    OR: inactivityOr(cutoff),
  };
}

export function relanceWhere(now = new Date()) {
  const cutoff = monthsAgo(now, RELANCE_MONTHS);
  return {
    status: { isConverted: false, isLost: false },
    OR: inactivityOr(cutoff),
  };
}

export function archivedWhere(now = new Date()) {
  const rejectedCutoff = daysAgo(now, REJECTED_ARCHIVE_DAYS);
  const finalizedCutoff = daysAgo(now, FINALIZED_ARCHIVE_DAYS);
  return {
    OR: [
      { status: { isLost: true }, OR: inactivityOr(rejectedCutoff) },
      { status: { isConverted: true }, OR: inactivityOr(finalizedCutoff) },
    ],
  };
}

export function notArchivedWhere(now = new Date()) {
  return { NOT: archivedWhere(now) };
}
