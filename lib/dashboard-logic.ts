export { isDormantProspect, dormantWhere } from "@/lib/safecheck";
export { relanceWhere as followUpWhere } from "@/lib/safecheck";

export const PIPELINE_GOAL = 70;
export const DORMANT_DAYS = 180;
export const DASHBOARD_KPI_DETAIL_LIMIT = 40;

export type DashboardKpiKind =
  | { type: "mine" }
  | { type: "all" }
  | { type: "dormant" }
  | { type: "relance" }
  | { type: "status"; statusId: string };

export type DashboardKpi = {
  id?: string;
  label: string;
  hint: string;
  value: number;
  tone: "orange" | "navy" | "blue" | "green" | "red" | "urgent" | "brand";
  href: string;
  suffix?: string;
  icon?: string;
  /** Évolution en % depuis le début du mois (positif = hausse). */
  trend?: number;
};

/** Évolution en % entre la valeur en début de mois et la valeur actuelle. */
export function monthTrendPercent(current: number, previous: number) {
  if (current === previous) return 0;
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export const DASHBOARD_PERIODS = [
  { id: "mois", label: "Ce mois" },
  { id: "trimestre", label: "Ce trimestre" },
  { id: "annee", label: "Cette année" },
  { id: "tout", label: "Tout" },
] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number]["id"];

export function parseDashboardPeriod(value?: string | string[] | null): DashboardPeriod {
  const raw = Array.isArray(value) ? value[0] : value;
  return DASHBOARD_PERIODS.find((item) => item.id === raw)?.id ?? "mois";
}

/** Début de la période calendaire en cours ; `null` = pas de borne (« Tout »). */
export function dashboardPeriodStart(period: DashboardPeriod, now = new Date()) {
  if (period === "mois") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "trimestre") return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (period === "annee") return new Date(now.getFullYear(), 0, 1);
  return null;
}

/** Prospects créés ou suivis depuis `start` (même ancrage que l’inactivité). */
export function activeSinceWhere(start: Date | null) {
  if (!start) return {};
  return {
    OR: [
      { createdAt: { gte: start } },
      { lastActionAt: { gte: start } },
      { firstContactAt: { gte: start } },
      { lastContactAt: { gte: start } },
    ],
  };
}

export type DashboardKpiDetailRow = {
  id: string;
  href: string;
  title: string;
  status: string;
  statusSlug: string;
  isConverted: boolean;
  isLost: boolean;
  statusId: string;
  ownerId: string;
  owner: string;
  lastAction: string;
  action: string;
  meetingAt: string;
  code: string;
};

export const RELANCE_TABLE_COLUMNS = ["Nom de l'entreprise", "Statut", "Action", "Date"] as const;
export const TEAM_PROSPECT_TABLE_COLUMNS = [
  "Nom de l'entreprise",
  "Commercial",
  "Statut",
  "Commentaire",
  "Dernière action",
] as const;

export function isRelanceDashboardKpi(id?: string) {
  return id === "relance";
}

export function isCommentableDashboardKpi(id?: string) {
  return Boolean(id && (id === "relance" || id === "all" || id === "mine" || id === "dormant" || id.startsWith("status:")));
}

export function dashboardProspectTableColumns(showOwner: boolean) {
  return showOwner ? TEAM_PROSPECT_TABLE_COLUMNS : RELANCE_TABLE_COLUMNS;
}

export type DashboardKpiDetails = {
  items: DashboardKpiDetailRow[];
  truncated: boolean;
};

export function inactivityAnchor(lastContactAt: Date | null, createdAt: Date) {
  return lastContactAt ?? createdAt;
}

export function parseDashboardKpiId(id: string): DashboardKpiKind | null {
  if (id === "mine" || id === "all" || id === "dormant" || id === "relance") return { type: id };
  if (id.startsWith("status:")) {
    const statusId = id.slice("status:".length).trim();
    return statusId ? { type: "status", statusId } : null;
  }
  return null;
}

export function dashboardKpiHeading(label: string) {
  return label.replace(/\s\p{Extended_Pictographic}\s*$/u, "").trim();
}

export function dashboardKpiDetailTitle(companyName: string | null | undefined, firstName: string, lastName: string) {
  return companyName?.trim() || `${firstName} ${lastName}`.trim() || "Prospect";
}

export function allProspectsKpi(
  count: number,
  options?: { scope?: "mine" | "all"; href?: string; trend?: number },
) {
  if (options?.scope === "all") {
    return {
      id: "all",
      label: "Tous les prospects",
      hint: "Ajoutés par les agents commerciaux",
      value: count,
      tone: "brand" as const,
      href: options.href ?? "/direction/prospects",
      trend: options.trend,
    };
  }
  return {
    id: "mine",
    label: "Tous les prospects",
    hint: "Ensemble de mes prospects actifs",
    value: count,
    tone: "brand" as const,
    href: options?.href ?? "/prospects?mine=1",
    trend: options?.trend,
  };
}

export function dormantProspectsKpi(count: number, href: string, trend?: number) {
  return {
    id: "dormant",
    label: "Prospects dormants",
    hint: "Inactivité > 2 mois",
    value: count,
    tone: "orange" as const,
    href,
    trend,
  };
}

export function followUpProspectsKpi(count: number, href: string, trend?: number) {
  return {
    id: "relance",
    label: "A relancer",
    hint: "Prospects à relancer",
    value: count,
    tone: "navy" as const,
    href,
    icon: "bi-exclamation-triangle-fill",
    trend,
  };
}

/** Points de performance gagnés selon le statut courant du prospect. */
export const PROSPECT_PERFORMANCE_POINTS = {
  opportunite: 5,
  lead: 15,
  pipeline: 30,
  finalise: 50,
  rejete: 0,
} as const;

export type ProspectPerformanceSlug = keyof typeof PROSPECT_PERFORMANCE_POINTS;

export type AgentPerformanceBreakdown = {
  percent: number;
  points: number;
  byStage: {
    opportunite: number;
    lead: number;
    pipeline: number;
    finalise: number;
  };
};

export function prospectPerformancePoints(slug: string): number {
  return PROSPECT_PERFORMANCE_POINTS[slug as ProspectPerformanceSlug] ?? 0;
}

/** Score agent = somme des points des prospects, plafonnée à 100 %. */
export function agentPerformanceFromStatusCounts(
  countsBySlug: Iterable<{ slug: string; count: number }>,
): AgentPerformanceBreakdown {
  const byStage = { opportunite: 0, lead: 0, pipeline: 0, finalise: 0 };
  let points = 0;

  for (const item of countsBySlug) {
    const count = Math.max(0, Math.floor(item.count));
    if (count === 0) continue;
    points += prospectPerformancePoints(item.slug) * count;
    if (item.slug === "opportunite" || item.slug === "lead" || item.slug === "pipeline" || item.slug === "finalise") {
      byStage[item.slug] += count;
    }
  }

  return {
    points,
    percent: Math.min(100, points),
    byStage,
  };
}
