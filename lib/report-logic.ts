const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export type AnalyticsRange = "Tout" | "Cette année" | "Ce mois" | "Cette semaine";

export const CONTACTED_SLUGS = new Set(["lead", "pipeline", "finalise"]);
export const QUALIFIED_SLUGS = new Set(["pipeline", "finalise"]);

export function conversionPercent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function monthBounds(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export type FunnelStep = { label: string; value: number; rate: number; stepRate: number };

export function buildFunnel(steps: { label: string; value: number }[]): FunnelStep[] {
  return steps.map((step, index) => ({
    ...step,
    rate: index === 0 ? (step.value > 0 ? 100 : 0) : conversionPercent(step.value, steps[0]?.value ?? 0),
    stepRate: index === 0 ? (step.value > 0 ? 100 : 0) : conversionPercent(step.value, steps[index - 1]?.value ?? 0),
  }));
}

export type ReportProspect = {
  statusSlug: string;
  isConverted: boolean;
  lastContactAt: Date | null;
  sourceName: string | null;
  opportunityCount: number;
  wonOpportunity: boolean;
};

export function isContacted(row: ReportProspect) {
  return Boolean(row.lastContactAt) || CONTACTED_SLUGS.has(row.statusSlug);
}

export function isQualified(row: ReportProspect) {
  return QUALIFIED_SLUGS.has(row.statusSlug) || row.isConverted;
}

export function funnelFromProspects(rows: ReportProspect[]) {
  return buildFunnel([
    { label: "Prospects", value: rows.length },
    { label: "Contactés", value: rows.filter(isContacted).length },
    { label: "Qualifiés", value: rows.filter(isQualified).length },
    { label: "Opportunités", value: rows.filter((row) => row.opportunityCount > 0).length },
    { label: "Clients", value: rows.filter((row) => row.isConverted || row.wonOpportunity).length },
  ]);
}

export function sourceReport(rows: ReportProspect[]) {
  const map = new Map<string, { prospects: number; clients: number }>();
  for (const row of rows) {
    const name = row.sourceName?.trim() || "Non renseignée";
    const current = map.get(name) ?? { prospects: 0, clients: 0 };
    current.prospects += 1;
    if (row.isConverted || row.wonOpportunity) current.clients += 1;
    map.set(name, current);
  }
  return [...map.entries()]
    .map(([name, item]) => ({
      name,
      prospects: item.prospects,
      clients: item.clients,
      conversion: conversionPercent(item.clients, item.prospects),
    }))
    .sort((a, b) => b.prospects - a.prospects || b.clients - a.clients);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function last12MonthBuckets(dates: Date[], now = new Date()) {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return { year: date.getFullYear(), monthIndex: date.getMonth(), label: MONTHS[date.getMonth()], value: 0 };
  });
  const lookup = new Map(buckets.map((item) => [`${item.year}-${item.monthIndex}`, item]));
  for (const date of dates) {
    const bucket = lookup.get(`${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.value += 1;
  }
  return buckets;
}

export function lastNDayCounts(dates: Date[], days = 7, now = new Date()) {
  const today = startOfDay(now);
  const counts = Array.from({ length: days }, () => 0);
  for (const date of dates) {
    const diff = Math.round((today.getTime() - startOfDay(date).getTime()) / 86_400_000);
    if (diff >= 0 && diff < days) counts[days - 1 - diff] += 1;
  }
  return counts;
}

export function lastNWeekCounts(dates: Date[], weeks = 4, now = new Date()) {
  const today = startOfDay(now);
  const counts = Array.from({ length: weeks }, () => 0);
  for (const date of dates) {
    const diff = Math.round((today.getTime() - startOfDay(date).getTime()) / 86_400_000);
    const week = Math.floor(diff / 7);
    if (week >= 0 && week < weeks) counts[weeks - 1 - week] += 1;
  }
  return counts;
}

export function countInRange(dates: Date[], start: Date, end: Date) {
  const from = start.getTime();
  const to = end.getTime();
  return dates.filter((date) => {
    const time = date.getTime();
    return time >= from && time <= to;
  }).length;
}

export function last12MonthWinRates(
  closed: { date: Date; won: boolean }[],
  now = new Date(),
) {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return {
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      label: MONTHS[date.getMonth()],
      won: 0,
      closed: 0,
      value: 0,
    };
  });
  const lookup = new Map(buckets.map((item) => [`${item.year}-${item.monthIndex}`, item]));
  for (const item of closed) {
    const bucket = lookup.get(`${item.date.getFullYear()}-${item.date.getMonth()}`);
    if (!bucket) continue;
    bucket.closed += 1;
    if (item.won) bucket.won += 1;
  }
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: conversionPercent(bucket.won, bucket.closed),
  }));
}

export function monthWinRate(closed: { date: Date; won: boolean }[], now = new Date()) {
  const { start, end } = monthBounds(now.getFullYear(), now.getMonth());
  const inMonth = closed.filter((item) => item.date >= start && item.date <= end);
  return conversionPercent(
    inMonth.filter((item) => item.won).length,
    inMonth.length,
  );
}

export function buildAnalyticsSeries(dates: Date[], now = new Date()) {
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const { start: monthStart, end: monthEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const weekStart = startOfDay(now);
  weekStart.setDate(weekStart.getDate() - 6);

  return {
    Tout: {
      total: dates.length,
      spark: last12MonthBuckets(dates, now).map((item) => item.value),
      caption: "Volume d’activités · 12 mois",
    },
    "Cette année": {
      total: countInRange(dates, yearStart, now),
      spark: last12MonthBuckets(dates, now).map((item) => item.value),
      caption: "Volume d’activités · année en cours",
    },
    "Ce mois": {
      total: countInRange(dates, monthStart, monthEnd),
      spark: lastNWeekCounts(dates, 4, now),
      caption: "Volume d’activités · mois en cours",
    },
    "Cette semaine": {
      total: countInRange(dates, weekStart, now),
      spark: lastNDayCounts(dates, 7, now),
      caption: "Volume d’activités · 7 derniers jours",
    },
  } as const;
}
