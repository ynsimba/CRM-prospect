import type { AgentStatus, AssignmentMode, TaskType } from "@/lib/enums";
import { isArchivedProspect, isTerminalStatus } from "@/lib/safecheck";

/* ------------------------------------------------------------------ labels */

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  INACTIVE: "Inactif",
};

export const AGENT_STATUS_PILL: Record<AgentStatus, string> = {
  ACTIVE: "on",
  SUSPENDED: "warn",
  INACTIVE: "off",
};

export const ASSIGNMENT_MODE_LABELS: Record<AssignmentMode, string> = {
  MANUAL: "Manuel",
  ROUND_ROBIN: "Round Robin",
  LOAD: "Selon la charge",
  ZONE: "Selon la zone",
};

export const ASSIGNMENT_MODE_HELP: Record<AssignmentMode, string> = {
  MANUAL: "La Direction sélectionne elle-même l’agent.",
  ROUND_ROBIN: "Les nouveaux prospects sont distribués équitablement, à tour de rôle.",
  LOAD: "Le système privilégie l’agent qui a le moins de prospects actifs.",
  ZONE: "Le prospect va à l’équipe de sa zone, puis à l’agent le moins chargé de cette équipe.",
};

export function parseAgentStatus(value: unknown): AgentStatus {
  return value === "SUSPENDED" || value === "INACTIVE" ? value : "ACTIVE";
}

export function parseAssignmentMode(value: unknown): AssignmentMode {
  return value === "ROUND_ROBIN" || value === "LOAD" || value === "ZONE" ? value : "MANUAL";
}

/* ------------------------------------------------------------------ periods */

export const PERIODS = [
  { value: "month", label: "Ce mois" },
  { value: "30d", label: "30 derniers jours" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
] as const;

export type PeriodKey = (typeof PERIODS)[number]["value"];

export function parsePeriod(value: unknown): PeriodKey {
  return PERIODS.some((item) => item.value === value) ? (value as PeriodKey) : "month";
}

export function periodRange(key: PeriodKey, now = new Date()) {
  const to = now;
  let from: Date;
  if (key === "30d") {
    from = new Date(now);
    from.setDate(from.getDate() - 30);
  } else if (key === "quarter") {
    from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (key === "year") {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const label = PERIODS.find((item) => item.value === key)?.label ?? "";
  return { from, to, label };
}

export function inRange(date: Date | null | undefined, range: { from: Date; to: Date }) {
  return Boolean(date && date >= range.from && date <= range.to);
}

/* ------------------------------------------------------------------ dates */

function dayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function daysSince(date: Date, now = new Date()) {
  return Math.round((dayStart(now).getTime() - dayStart(date).getTime()) / 86_400_000);
}

/** « Aujourd’hui », « Hier », « Il y a 3 j » or a short date. */
export function relativeDayLabel(date: Date | null | undefined, now = new Date()) {
  if (!date) return "—";
  const days = daysSince(date, now);
  if (days <= 0) return "Aujourd’hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} j`;
  return date.toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export type Presence = "online" | "recent" | null;

/** Connected = seen in the last 15 minutes; recently active = in the last 24 hours. */
export function presence(lastSeenAt: Date | null | undefined, now = new Date()): Presence {
  if (!lastSeenAt) return null;
  const minutes = (now.getTime() - lastSeenAt.getTime()) / 60_000;
  if (minutes <= 15) return "online";
  if (minutes <= 24 * 60) return "recent";
  return null;
}

/* ------------------------------------------------------------------ portfolio */

export type PortfolioProspect = {
  id: string;
  ownerId: string | null;
  createdAt: Date;
  firstContactAt: Date | null;
  lastContactAt: Date | null;
  lastActionAt: Date | null;
  nextContactAt: Date | null;
  convertedAt: Date | null;
  status: { slug: string; isConverted: boolean; isLost: boolean };
};

export function isOpenProspect(prospect: PortfolioProspect) {
  return !isTerminalStatus(prospect.status);
}

/** « À traiter » : assigned, still open and never contacted. */
export function isUntreated(prospect: PortfolioProspect) {
  return isOpenProspect(prospect) && !prospect.firstContactAt && !prospect.lastContactAt;
}

export function isInPortfolio(prospect: PortfolioProspect, now = new Date()) {
  return !isArchivedProspect({ ...prospect, ...prospect.status }, now);
}

export function lastTouch(prospect: PortfolioProspect) {
  return prospect.lastActionAt ?? prospect.lastContactAt ?? prospect.firstContactAt ?? prospect.createdAt;
}

/* ------------------------------------------------------------------ tasks & alerts */

export type AgendaTask = {
  id: string;
  ownerId: string;
  type: TaskType;
  status: string;
  dueAt: Date | null;
};

export function isOpenTask(task: { status: string }) {
  return task.status === "TODO" || task.status === "IN_PROGRESS";
}

const FOLLOW_UP_TYPES = new Set<TaskType>(["FOLLOW_UP", "CALL"]);

/** Overdue follow-ups: open call/relance tasks past due, plus open prospects whose next contact date has passed. */
export function overdueFollowUps<T extends AgendaTask, P extends PortfolioProspect>(
  tasks: T[],
  prospects: P[],
  now = new Date(),
) {
  const today = dayStart(now);
  const taskItems = tasks.filter(
    (task) => isOpenTask(task) && FOLLOW_UP_TYPES.has(task.type) && task.dueAt && task.dueAt < today,
  );
  const prospectItems = prospects.filter(
    (prospect) => isOpenProspect(prospect) && prospect.nextContactAt && prospect.nextContactAt < today,
  );
  return { tasks: taskItems, prospects: prospectItems, count: taskItems.length + prospectItems.length };
}

export function upcomingMeetings<T extends AgendaTask>(tasks: T[], now = new Date()) {
  const today = dayStart(now);
  return tasks.filter((task) => isOpenTask(task) && task.type === "MEETING" && task.dueAt && task.dueAt >= today);
}

export function meetingsToday<T extends AgendaTask>(tasks: T[], now = new Date()) {
  const key = dayKey(now);
  return upcomingMeetings(tasks, now).filter((task) => task.dueAt && dayKey(task.dueAt) === key);
}

export function staleProspects<P extends PortfolioProspect>(prospects: P[], now = new Date(), days = 7) {
  return prospects.filter((prospect) => isOpenProspect(prospect) && daysSince(lastTouch(prospect), now) >= days);
}

export type ProposalOpportunity = { id: string; stageName: string; status: string; updatedAt: Date };

/** Opportunities parked at the « Proposition » stage with no movement for `days` days. */
export function unansweredProposals<T extends ProposalOpportunity>(opportunities: T[], now = new Date(), days = 7) {
  return opportunities.filter(
    (opp) => opp.status === "OPEN" && /proposition/i.test(opp.stageName) && daysSince(opp.updatedAt, now) >= days,
  );
}

/* ------------------------------------------------------------------ distribution engine */

export type Candidate = { id: string; name: string; activeProspects: number; teamId: string | null; zoneId: string | null };

function byName(a: Candidate, b: Candidate) {
  return a.name.localeCompare(b.name, "fr") || a.id.localeCompare(b.id);
}

/** Next agent after `lastId` in a stable (alphabetical) rotation: Jean → Sarah → David → Jean… */
export function pickRoundRobin(candidates: Candidate[], lastId: string | null | undefined) {
  const ordered = [...candidates].sort(byName);
  if (ordered.length === 0) return null;
  const index = ordered.findIndex((item) => item.id === lastId);
  return ordered[(index + 1) % ordered.length];
}

/** Agent with the fewest active prospects; ties broken alphabetically. */
export function pickByLoad(candidates: Candidate[]) {
  const ordered = [...candidates].sort((a, b) => a.activeProspects - b.activeProspects || byName(a, b));
  return ordered[0] ?? null;
}

export type ZoneRule = { id: string; name: string; teamId: string | null; matchTerms: string };

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function zoneTerms(matchTerms: string) {
  return matchTerms
    .split(/[,;\n]/)
    .map((term) => normalize(term).trim())
    .filter(Boolean);
}

/** First zone whose terms appear in the prospect's city or address (« Kinshasa/Gombe », « Lubumbashi »…). */
export function matchZone(zones: ZoneRule[], prospect: { city?: string | null; address?: string | null }) {
  const haystack = normalize(`${prospect.city ?? ""} ${prospect.address ?? ""}`);
  if (!haystack.trim()) return null;
  // Most specific terms first, so « Kinshasa/Gombe » wins over « Kinshasa ».
  const scored = zones
    .flatMap((zone) => zoneTerms(zone.matchTerms).map((term) => ({ zone, term })))
    .filter(({ term }) => term.split("/").every((part) => haystack.includes(part.trim())))
    .sort((a, b) => b.term.length - a.term.length);
  return scored[0]?.zone ?? null;
}

export function pickAgent(
  mode: AssignmentMode,
  candidates: Candidate[],
  context: { lastAssignedId?: string | null; zones?: ZoneRule[]; prospect?: { city?: string | null; address?: string | null } },
) {
  if (candidates.length === 0 || mode === "MANUAL") return null;
  if (mode === "ROUND_ROBIN") return pickRoundRobin(candidates, context.lastAssignedId);
  if (mode === "ZONE") {
    const zone = context.prospect ? matchZone(context.zones ?? [], context.prospect) : null;
    if (zone) {
      const inZone = candidates.filter(
        (item) => item.zoneId === zone.id || (zone.teamId !== null && item.teamId === zone.teamId),
      );
      if (inZone.length > 0) return pickByLoad(inZone);
    }
  }
  return pickByLoad(candidates);
}

/** Distributes a batch one prospect at a time, updating loads so the batch itself stays balanced. */
export function planDistribution(
  mode: AssignmentMode,
  candidates: Candidate[],
  prospects: { id: string; city?: string | null; address?: string | null }[],
  context: { lastAssignedId?: string | null; zones?: ZoneRule[] } = {},
) {
  const pool = candidates.map((item) => ({ ...item }));
  let last = context.lastAssignedId ?? null;
  const plan: { prospectId: string; agentId: string }[] = [];
  for (const prospect of prospects) {
    const agent = pickAgent(mode, pool, { lastAssignedId: last, zones: context.zones, prospect });
    if (!agent) continue;
    plan.push({ prospectId: prospect.id, agentId: agent.id });
    agent.activeProspects += 1;
    last = agent.id;
  }
  return { plan, lastAssignedId: last };
}

/* ------------------------------------------------------------------ goals & ratios */

export const GOAL_METRICS = [
  { key: "prospects", target: "prospectsTarget", label: "Prospects à traiter" },
  { key: "calls", target: "callsTarget", label: "Appels" },
  { key: "meetings", target: "meetingsTarget", label: "RDV" },
  { key: "proposals", target: "proposalsTarget", label: "Propositions" },
  { key: "conversions", target: "conversionsTarget", label: "Conversions" },
  { key: "revenue", target: "revenueTarget", label: "CA cible" },
] as const;

export type GoalMetricKey = (typeof GOAL_METRICS)[number]["key"];
export type GoalTargetKey = (typeof GOAL_METRICS)[number]["target"];
export type GoalTargets = Record<GoalTargetKey, number>;

export function emptyTargets(): GoalTargets {
  return {
    prospectsTarget: 0,
    callsTarget: 0,
    meetingsTarget: 0,
    proposalsTarget: 0,
    conversionsTarget: 0,
    revenueTarget: 0,
  };
}

export function goalProgress(achieved: number, target: number) {
  if (!target) return { achieved, target, pct: null as number | null };
  return { achieved, target, pct: Math.round((achieved / target) * 100) };
}

export function rate(numerator: number, denominator: number) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

export function averageDays(pairs: { from: Date; to: Date | null | undefined }[]) {
  const spans = pairs
    .filter((pair): pair is { from: Date; to: Date } => pair.to instanceof Date && pair.to >= pair.from)
    .map((pair) => (pair.to.getTime() - pair.from.getTime()) / 86_400_000);
  if (spans.length === 0) return null;
  return Math.round((spans.reduce((sum, value) => sum + value, 0) / spans.length) * 10) / 10;
}

/* ------------------------------------------------------------------ chart buckets */

export function monthBuckets(dates: Date[], now = new Date(), months = 6) {
  const points = Array.from({ length: months }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      key: `${start.getFullYear()}-${start.getMonth()}`,
      label: start.toLocaleDateString("fr-CD", { month: "short" }).replace(".", ""),
      value: 0,
    };
  });
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const date of dates) {
    const i = index.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (i !== undefined) points[i].value += 1;
  }
  return points.map(({ label, value }) => ({ label, value }));
}

function weekStart(date: Date) {
  const start = dayStart(date);
  const day = (start.getDay() + 6) % 7; // Monday = 0
  start.setDate(start.getDate() - day);
  return start;
}

export function isoWeek(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export function weekBuckets(dates: Date[], now = new Date(), weeks = 8) {
  const current = weekStart(now);
  const points = Array.from({ length: weeks }, (_, index) => {
    const start = new Date(current);
    start.setDate(start.getDate() - 7 * (weeks - 1 - index));
    return { key: dayKey(start), label: `S${isoWeek(start)}`, value: 0 };
  });
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const date of dates) {
    const i = index.get(dayKey(weekStart(date)));
    if (i !== undefined) points[i].value += 1;
  }
  return points.map(({ label, value }) => ({ label, value }));
}

/* ------------------------------------------------------------------ identity */

export function nextMatricule(existing: (string | null | undefined)[]) {
  const max = existing.reduce((highest, value) => {
    const match = /^AG-(\d+)$/.exec(value ?? "");
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `AG-${String(max + 1).padStart(4, "0")}`;
}

/** « Jean M. » as in the spec's agent table. */
export function shortAgentName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  if (!first) return "";
  const last = rest.join(" ");
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

/** Weekly counts split by activity family, oldest week first (for the stacked trend chart). */
export const TREND_SERIES = [
  { key: "calls", label: "Appels", types: ["CALL"] },
  { key: "emails", label: "E-mails", types: ["EMAIL", "WHATSAPP", "SMS"] },
  { key: "meetings", label: "RDV", types: ["MEETING", "VISIT", "DEMO"] },
  { key: "proposals", label: "Propositions", types: ["PROPOSAL"] },
  { key: "other", label: "Autres", types: ["NOTE", "OTHER"] },
] as const;

export type TrendKey = (typeof TREND_SERIES)[number]["key"];
export type TrendPoint = { label: string; range: string; values: Record<TrendKey, number> };

export function weeklyActivityTrend(items: { occurredAt: Date; type: string }[], now = new Date(), weeks = 8): TrendPoint[] {
  const current = weekStart(now);
  const familyOf = new Map<string, TrendKey>();
  for (const series of TREND_SERIES) for (const type of series.types) familyOf.set(type, series.key);
  const points = Array.from({ length: weeks }, (_, index) => {
    const start = new Date(current);
    start.setDate(start.getDate() - 7 * (weeks - 1 - index));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (date: Date) => date.toLocaleDateString("fr-CD", { day: "2-digit", month: "2-digit" });
    return {
      key: dayKey(start),
      label: `S${isoWeek(start)}`,
      range: `${fmt(start)} – ${fmt(end)}`,
      values: { calls: 0, emails: 0, meetings: 0, proposals: 0, other: 0 } as Record<TrendKey, number>,
    };
  });
  const index = new Map(points.map((point, i) => [point.key, i]));
  for (const item of items) {
    const i = index.get(dayKey(weekStart(item.occurredAt)));
    if (i === undefined) continue;
    points[i].values[familyOf.get(item.type) ?? "other"] += 1;
  }
  return points.map(({ label, range, values }) => ({ label, range, values }));
}

/* ------------------------------------------------------------------ monthly goal pace */

/** Where we are in the month: drives the « rythme attendu » marker on each goal. */
export function monthPace(now = new Date()) {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = now.getDate();
  return { day, daysInMonth, remainingDays: daysInMonth - day, elapsed: day / daysInMonth };
}

export type GoalStatus = "none" | "done" | "on-track" | "at-risk" | "behind";

/** Compares what is achieved with what should be achieved by today at a linear pace. */
export function goalStatus(achieved: number, target: number, elapsed: number): GoalStatus {
  if (!target) return "none";
  if (achieved >= target) return "done";
  const expected = target * Math.min(Math.max(elapsed, 0), 1);
  if (expected <= 0) return "on-track";
  const ratio = achieved / expected;
  if (ratio >= 0.9) return "on-track";
  if (ratio >= 0.6) return "at-risk";
  return "behind";
}

/** Daily effort left to reach the target by month end (today included). */
export function dailyNeeded(achieved: number, target: number, remainingDays: number) {
  const left = Math.max(target - achieved, 0);
  if (!left) return 0;
  return Math.ceil(left / Math.max(remainingDays + 1, 1));
}

/** « 2 ans et 3 mois » since the hiring date (calendar date stored at UTC midnight). */
export function seniorityLabel(hiredAt: Date | null | undefined, now = new Date()) {
  if (!hiredAt) return null;
  let months =
    (now.getFullYear() - hiredAt.getUTCFullYear()) * 12 + (now.getMonth() - hiredAt.getUTCMonth());
  if (now.getDate() < hiredAt.getUTCDate()) months -= 1;
  if (months < 0) return "Arrivée prochaine";
  if (months === 0) return "Moins d’un mois";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years ? `${years} an${years > 1 ? "s" : ""}` : "";
  const m = rest ? `${rest} mois` : "";
  return [y, m].filter(Boolean).join(" et ");
}
