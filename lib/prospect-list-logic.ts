import { needsRelance } from "@/lib/safecheck";
import { isSalesRole } from "@/lib/roles";
import type { Role } from "@/lib/enums";

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

export const GRID_SORTS = [
  ...PROSPECT_SORTS.map((item) => item.value),
  "industry",
  "address",
  "lastAction",
  "meeting",
  "status",
  "notes",
  "owner",
  "followUp",
] as const;

export const PROSPECT_DENSITIES = [
  { value: "compact", label: "Compacte" },
  { value: "medium", label: "Moyenne" },
  { value: "comfortable", label: "Confortable" },
] as const;

export type ProspectGroup = (typeof PROSPECT_GROUPS)[number]["value"];
export type ProspectSort = (typeof GRID_SORTS)[number];
export type ProspectDensity = (typeof PROSPECT_DENSITIES)[number]["value"];
export type ProspectDir = "asc" | "desc";

const GROUP_VALUES = new Set<string>(PROSPECT_GROUPS.map((item) => item.value));
const SORT_VALUES = new Set<string>(GRID_SORTS);
const DENSITY_VALUES = new Set<string>(PROSPECT_DENSITIES.map((item) => item.value));

export type ProspectListView = {
  mine: boolean;
  group: ProspectGroup;
  sort: ProspectSort;
  dir: ProspectDir;
  density: ProspectDensity;
};

export function firstSearchValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProspectListView(search: {
  mine?: string | string[];
  group?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  density?: string | string[];
}): ProspectListView {
  const mine = firstSearchValue(search.mine);
  const group = firstSearchValue(search.group) ?? "";
  const sort = firstSearchValue(search.sort);
  const dir = firstSearchValue(search.dir);
  const density = firstSearchValue(search.density);
  const resolvedSort = SORT_VALUES.has(sort ?? "") ? (sort as ProspectSort) : "updated";
  return {
    mine: mine === "1",
    group: GROUP_VALUES.has(group) ? (group as ProspectGroup) : "",
    sort: resolvedSort,
    dir: dir === "asc" || dir === "desc" ? dir : defaultDirForSort(resolvedSort),
    density: DENSITY_VALUES.has(density ?? "") ? (density as ProspectDensity) : "medium",
  };
}

export function defaultDirForSort(sort?: string) {
  if (sort === "name" || sort === "company" || sort === "industry" || sort === "address" || sort === "status" || sort === "notes" || sort === "owner") {
    return "asc";
  }
  return "desc";
}

export function prismaProspectSort(sort: ProspectSort): "updated" | "name" | "company" | "score" | "priority" {
  if (sort === "name" || sort === "company" || sort === "score" || sort === "priority") return sort;
  return "updated";
}

/** Filtre propriétaire : « Mes Prospects » = toujours l’utilisateur connecté. */
export function resolveProspectOwnerScope(
  session: { role: string; userId: string },
  filters: { mine?: boolean; ownerId?: string } = {},
) {
  if (filters.mine) return { ownerId: session.userId };
  if (isSalesRole(session.role as Role)) return { ownerId: session.userId };
  if (filters.ownerId) return { ownerId: filters.ownerId };
  return {};
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

export function prospectFormulaInput(prospect: {
  lastActionAt?: Date | null;
  firstContactAt?: Date | null;
  lastContactAt?: Date | null;
  createdAt: Date;
  status: { isConverted: boolean; isLost: boolean; slug: string };
}) {
  return {
    lastActionAt: prospect.lastActionAt,
    firstContactAt: prospect.firstContactAt,
    lastContactAt: prospect.lastContactAt,
    createdAt: prospect.createdAt,
    isConverted: prospect.status.isConverted,
    isLost: prospect.status.isLost,
    slug: prospect.status.slug,
  };
}

export function specLastActionAt(prospect: {
  lastActionAt?: Date | null;
  firstContactAt?: Date | null;
  lastContactAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  activities?: { occurredAt: Date }[];
}) {
  return (
    prospect.lastActionAt ??
    prospect.firstContactAt ??
    lastActionDate({
      lastContactAt: prospect.lastContactAt ?? null,
      updatedAt: prospect.updatedAt ?? prospect.createdAt,
      activityAt: prospect.activities?.[0]?.occurredAt ?? null,
    })
  );
}

export function needsFollowUpAlert(
  input: {
    nextContactAt?: Date | null;
    lastActionAt?: Date | null;
    firstContactAt?: Date | null;
    lastContactAt?: Date | null;
    createdAt?: Date;
    isConverted?: boolean;
    isLost?: boolean;
    slug?: string;
  },
  now = new Date(),
) {
  return needsRelance(
    {
      lastActionAt: input.lastActionAt,
      firstContactAt: input.firstContactAt,
      lastContactAt: input.lastContactAt,
      createdAt: input.createdAt ?? now,
      isConverted: input.isConverted,
      isLost: input.isLost,
      slug: input.slug,
    },
    now,
  );
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

export type GridRowLike = {
  companyName: string;
  industry: string;
  address: string;
  city: string;
  lastActionAt: string | null;
  meetingAt: string | null;
  statusId: string;
  statusName: string;
  notes: string;
  ownerId: string;
  ownerName: string;
  needsFollowUp: boolean;
};

export type GridFilterQuery = {
  company?: string;
  industry?: string;
  address?: string;
  lastAction?: string;
  meeting?: string;
  notes?: string;
  followUp?: string;
  status?: string;
  owner?: string;
};

export type GridFilterOption = { value: string; label: string };

export const COMMERCIAL_GRID_COLUMNS = [
  { key: "company", label: "Nom entreprise", sort: "company", filter: "company" },
  { key: "industry", label: "Secteur", sort: "industry", filter: "industry" },
  { key: "address", label: "Adresse", sort: "address", filter: "address" },
  { key: "lastAction", label: "Date dernière action", sort: "lastAction", filter: "lastAction" },
  { key: "meeting", label: "Date RDV", sort: "meeting", filter: "meeting" },
  { key: "status", label: "Statut", sort: "status", filter: "status" },
  { key: "notes", label: "Commentaire statut", sort: "notes", filter: "notes" },
  { key: "owner", label: "Commercial responsable", sort: "owner", filter: "owner" },
  { key: "followUp", label: "Alerte Relance", sort: "followUp", filter: "followUp" },
] as const;

export type GridColumnKey = (typeof COMMERCIAL_GRID_COLUMNS)[number]["key"];

export const GRID_COL_WIDTHS: Record<GridColumnKey, number> = {
  company: 200,
  industry: 120,
  address: 200,
  lastAction: 148,
  meeting: 118,
  status: 132,
  notes: 168,
  owner: 196,
  followUp: 148,
};

export function uniqueTextOptions(values: string[], emptyLabel = "Vide") {
  const seen = new Set<string>();
  const options: GridFilterOption[] = [];
  for (const raw of values) {
    const value = raw.trim();
    const key = value || "__empty__";
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ value: key, label: value || emptyLabel });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

export function dateFilterKey(value: string | null) {
  return toDateInput(value);
}

export function uniqueDateOptions(values: (string | null)[], emptyLabel = "Sans date") {
  const seen = new Set<string>();
  const options: GridFilterOption[] = [];
  for (const raw of values) {
    const key = dateFilterKey(raw);
    const id = key || "__empty__";
    if (seen.has(id)) continue;
    seen.add(id);
    options.push({ value: id, label: key ? formatShortDate(raw) : emptyLabel });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

export function gridColumnOptions(
  column: (typeof COMMERCIAL_GRID_COLUMNS)[number]["filter"],
  rows: GridRowLike[],
  extras?: { statuses?: GridFilterOption[]; owners?: GridFilterOption[] },
): GridFilterOption[] {
  if (column === "company") return uniqueTextOptions(rows.map((row) => row.companyName), "Sans entreprise");
  if (column === "industry") return uniqueTextOptions(rows.map((row) => row.industry), "Non renseigné");
  if (column === "address") return uniqueTextOptions(rows.map((row) => row.address), "Non renseignée");
  if (column === "lastAction") return uniqueDateOptions(rows.map((row) => row.lastActionAt), "Sans date");
  if (column === "meeting") return uniqueDateOptions(rows.map((row) => row.meetingAt), "Sans date RDV");
  if (column === "status") return extras?.statuses ?? uniqueTextOptions(rows.map((row) => row.statusName));
  if (column === "notes") return uniqueTextOptions(rows.map((row) => row.notes), "Sans commentaire");
  if (column === "owner") {
    return extras?.owners ?? uniqueTextOptions(rows.map((row) => row.ownerName), "Non assigné");
  }
  if (column === "followUp") {
    return [
      { value: "1", label: "Relance nécessaire" },
      { value: "0", label: "Pas d’alerte" },
    ];
  }
  return [];
}

function textMatches(value: string, expected?: string) {
  if (!expected) return true;
  if (expected === "__empty__") return !value.trim();
  return value.trim() === expected;
}

function dateMatches(value: string | null, expected?: string) {
  if (!expected) return true;
  if (expected === "1") return Boolean(value);
  if (expected === "0") return !value;
  const key = dateFilterKey(value) || "__empty__";
  return key === expected;
}

export function filterGridRows<T extends GridRowLike>(rows: T[], query: GridFilterQuery) {
  return rows.filter((row) => {
    if (!textMatches(row.companyName, query.company)) return false;
    if (!textMatches(row.industry, query.industry)) return false;
    if (!textMatches(row.address, query.address)) return false;
    if (!dateMatches(row.lastActionAt, query.lastAction)) return false;
    if (!dateMatches(row.meetingAt, query.meeting)) return false;
    if (query.notes === "1" && !row.notes.trim()) return false;
    if (query.notes === "0" && row.notes.trim()) return false;
    if (query.notes && query.notes !== "1" && query.notes !== "0" && !textMatches(row.notes, query.notes)) return false;
    if (query.followUp === "1" && !row.needsFollowUp) return false;
    if (query.followUp === "0" && row.needsFollowUp) return false;
    if (query.status && row.statusId !== query.status && row.statusName !== query.status) return false;
    if (query.owner && row.ownerId !== query.owner && row.ownerName !== query.owner) return false;
    return true;
  });
}

function cmpText(a: string, b: string, dir: ProspectDir) {
  const result = a.localeCompare(b, "fr", { sensitivity: "base" });
  return dir === "asc" ? result : -result;
}

function cmpDate(a: string | null, b: string | null, dir: ProspectDir) {
  const left = a ? Date.parse(a) : 0;
  const right = b ? Date.parse(b) : 0;
  return dir === "asc" ? left - right : right - left;
}

export function sortGridRows<T extends GridRowLike>(rows: T[], sort: ProspectSort, dir: ProspectDir) {
  const copy = [...rows];
  copy.sort((left, right) => {
    if (sort === "company" || sort === "name") return cmpText(left.companyName, right.companyName, dir);
    if (sort === "industry") return cmpText(left.industry, right.industry, dir);
    if (sort === "address") return cmpText(left.address, right.address, dir);
    if (sort === "lastAction") return cmpDate(left.lastActionAt, right.lastActionAt, dir);
    if (sort === "meeting") return cmpDate(left.meetingAt, right.meetingAt, dir);
    if (sort === "status") return cmpText(left.statusName, right.statusName, dir);
    if (sort === "notes") return cmpText(left.notes, right.notes, dir);
    if (sort === "owner") return cmpText(left.ownerName, right.ownerName, dir);
    if (sort === "followUp") {
      const result = Number(left.needsFollowUp) - Number(right.needsFollowUp);
      return dir === "asc" ? result : -result;
    }
    return cmpDate(left.lastActionAt, right.lastActionAt, dir);
  });
  return copy;
}

export function groupGridRows<T extends GridRowLike>(rows: T[], group: ProspectGroup) {
  if (!group) return [{ key: "all", label: "", items: rows }];
  const buckets = new Map<string, { key: string; label: string; items: T[] }>();
  for (const row of rows) {
    let key = "";
    let label = "";
    if (group === "status") {
      key = row.statusName;
      label = row.statusName;
    } else if (group === "company") {
      key = row.companyName;
      label = row.companyName || "Sans entreprise";
    } else if (group === "owner") {
      key = row.ownerName;
      label = row.ownerName || "Non assigné";
    } else if (group === "city") {
      key = row.city;
      label = row.city.trim() || "Ville non renseignée";
    } else {
      key = row.industry;
      label = row.industry.trim() || "Non renseigné";
    }
    const bucket = buckets.get(key) ?? { key, label, items: [] };
    bucket.items.push(row);
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}
