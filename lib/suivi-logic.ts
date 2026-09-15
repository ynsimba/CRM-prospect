import { PROSPECT_SORTS } from "./prospect-list-logic";

export const SUIVI_BOARD_COLUMNS = [
  { key: "uncategorized", name: "Non catégorisée", slug: "", tone: "uncategorized" },
  { key: "opportunite", name: "Opportunité", slug: "opportunite", tone: "opportunite" },
  { key: "lead", name: "Lead", slug: "lead", tone: "lead" },
  { key: "pipeline", name: "Pipeline", slug: "pipeline", tone: "pipeline" },
  { key: "finalise", name: "Finalisé", slug: "finalise", tone: "finalise" },
  { key: "rejete", name: "Rejeté", slug: "rejete", tone: "rejete" },
] as const;

export type SuiviBoardKey = (typeof SUIVI_BOARD_COLUMNS)[number]["key"];
export type SuiviBoardTone = (typeof SUIVI_BOARD_COLUMNS)[number]["tone"];

export type SuiviCard = {
  id: string;
  title: string;
  ownerName: string | null;
  href: string;
};

export type SuiviColumn = {
  key: SuiviBoardKey;
  name: string;
  slug: string;
  tone: SuiviBoardTone;
  statusId: string | null;
  droppable: boolean;
  items: SuiviCard[];
};

const KNOWN_SLUGS = new Set<string>(
  SUIVI_BOARD_COLUMNS.map((column) => column.slug).filter((slug) => slug.length > 0),
);

export function isSuiviStatusSlug(slug: string) {
  return KNOWN_SLUGS.has(slug);
}

export type SuiviProspect = {
  id: string;
  firstName: string;
  lastName: string;
  company?: { name: string } | null;
  owner?: { name: string } | null;
  status: { id: string; slug: string };
};

export function suiviCardTitle(prospect: Pick<SuiviProspect, "firstName" | "lastName" | "company">) {
  const company = prospect.company?.name?.trim();
  if (company) return company;
  return `${prospect.firstName} ${prospect.lastName}`.trim();
}

export function buildSuiviColumns(
  prospects: SuiviProspect[],
  statuses: Array<{ id: string; slug: string }>,
): SuiviColumn[] {
  return SUIVI_BOARD_COLUMNS.map((spec) => {
    const status = spec.slug ? statuses.find((item) => item.slug === spec.slug) : undefined;
    const items = prospects
      .filter((prospect) =>
        spec.slug ? prospect.status.slug === spec.slug : !isSuiviStatusSlug(prospect.status.slug),
      )
      .map((prospect) => ({
        id: prospect.id,
        title: suiviCardTitle(prospect),
        ownerName: prospect.owner?.name ?? null,
        href: `/prospects/${prospect.id}`,
      }));
    return {
      key: spec.key,
      name: spec.name,
      slug: spec.slug,
      tone: spec.tone,
      statusId: status?.id ?? null,
      droppable: Boolean(status?.id),
      items,
    };
  });
}

export function suiviHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/suivi?${query}` : "/suivi";
}

export const SUIVI_SORTS = PROSPECT_SORTS;
