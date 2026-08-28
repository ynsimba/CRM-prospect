export const PROSPECT_GROUPS = [
  { value: "", label: "Aucun" },
  { value: "status", label: "Statut" },
  { value: "company", label: "Entreprise" },
  { value: "owner", label: "Commercial" },
  { value: "source", label: "Source" },
  { value: "city", label: "Ville" },
] as const;

export const PROSPECT_SORTS = [
  { value: "updated", label: "Dernière mise à jour" },
  { value: "name", label: "Nom" },
  { value: "company", label: "Entreprise" },
  { value: "score", label: "Score" },
  { value: "priority", label: "Priorité" },
] as const;

export const PROSPECT_DENSITIES = [
  { value: "compact", label: "Compacte" },
  { value: "medium", label: "Moyenne" },
  { value: "comfortable", label: "Confortable" },
] as const;

export type ProspectGroup = (typeof PROSPECT_GROUPS)[number]["value"];
export type ProspectSort = (typeof PROSPECT_SORTS)[number]["value"];
export type ProspectDensity = (typeof PROSPECT_DENSITIES)[number]["value"];

const GROUP_VALUES = new Set<string>(PROSPECT_GROUPS.map((item) => item.value));
const SORT_VALUES = new Set<string>(PROSPECT_SORTS.map((item) => item.value));
const DENSITY_VALUES = new Set<string>(PROSPECT_DENSITIES.map((item) => item.value));

export type ProspectListView = {
  mine: boolean;
  group: ProspectGroup;
  sort: ProspectSort;
  density: ProspectDensity;
};

export function parseProspectListView(search: {
  mine?: string;
  group?: string;
  sort?: string;
  density?: string;
}): ProspectListView {
  return {
    mine: search.mine === "1",
    group: GROUP_VALUES.has(search.group ?? "") ? (search.group as ProspectGroup) : "",
    sort: SORT_VALUES.has(search.sort ?? "") ? (search.sort as ProspectSort) : "updated",
    density: DENSITY_VALUES.has(search.density ?? "") ? (search.density as ProspectDensity) : "medium",
  };
}

export function prospectListHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/prospects?${query}` : "/prospects";
}

export type GroupableProspect = {
  city: string | null;
  company: { name: string } | null;
  status: { name: string };
  source: { name: string } | null;
  owner: { name: string } | null;
};

export function groupProspects<T extends GroupableProspect>(rows: T[], group: ProspectGroup) {
  if (!group) {
    return [{ key: "all", label: "", items: rows }];
  }

  const buckets = new Map<string, { key: string; label: string; items: T[] }>();
  for (const row of rows) {
    let key = "";
    let label = "";
    if (group === "status") {
      key = row.status.name;
      label = row.status.name;
    } else if (group === "company") {
      key = row.company?.name ?? "";
      label = row.company?.name ?? "Sans entreprise";
    } else if (group === "owner") {
      key = row.owner?.name ?? "";
      label = row.owner?.name ?? "Non assigné";
    } else if (group === "source") {
      key = row.source?.name ?? "";
      label = row.source?.name ?? "Non renseignée";
    } else {
      key = row.city ?? "";
      label = row.city?.trim() || "Ville non renseignée";
    }
    const bucket = buckets.get(key) ?? { key, label, items: [] };
    bucket.items.push(row);
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

export function lastActionDate(input: {
  lastContactAt: Date | null;
  updatedAt: Date;
  activityAt?: Date | null;
}) {
  return input.lastContactAt ?? input.activityAt ?? input.updatedAt;
}

export function needsFollowUpAlert(
  input: { nextContactAt: Date | null; isConverted?: boolean; isLost?: boolean },
  now = new Date(),
) {
  if (input.isConverted || input.isLost) return false;
  if (!input.nextContactAt) return true;
  return input.nextContactAt.getTime() <= now.getTime();
}

export function formatShortDate(value: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
}

export function toDateInput(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
