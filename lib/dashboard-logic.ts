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
};

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
  options?: { scope?: "mine" | "all"; href?: string },
) {
  if (options?.scope === "all") {
    return {
      id: "all",
      label: "Tous les prospects",
      hint: "Ajoutés par les agents commerciaux",
      value: count,
      tone: "brand" as const,
      href: options.href ?? "/direction/prospects",
    };
  }
  return {
    id: "mine",
    label: "Tous les prospects",
    hint: "Ensemble de mes prospects actifs",
    value: count,
    tone: "brand" as const,
    href: options?.href ?? "/prospects?mine=1",
  };
}

export function dormantProspectsKpi(count: number, href: string) {
  return {
    id: "dormant",
    label: "Prospects dormants",
    hint: "Prospect ayant 2 mois d’inactivité",
    value: count,
    tone: "orange" as const,
    href,
  };
}

export function followUpProspectsKpi(count: number, href: string) {
  return {
    id: "relance",
    label: "A relancer",
    hint: "Prospect à relancer",
    value: count,
    tone: "navy" as const,
    href,
    icon: "bi-exclamation-triangle-fill",
  };
}
