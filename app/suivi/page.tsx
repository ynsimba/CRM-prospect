import Shell from "@/components/Shell";
import SuiviKanban from "@/components/SuiviKanban";
import SuiviQueryBar from "@/components/SuiviQueryBar";
import { requirePermission } from "@/lib/auth";
import { parseProspectFilters } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { parseProspectListView, prismaProspectSort } from "@/lib/prospect-list-logic";
import { listProspects } from "@/lib/prospects";
import { buildSuiviColumns, isSuiviStatusSlug, SUIVI_BOARD_COLUMNS } from "@/lib/suivi-logic";
import { isSalesRole } from "@/lib/roles";

export default async function FollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    owner?: string;
    sort?: string;
  }>;
}) {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const isSales = isSalesRole(session.role);
  const params = await searchParams;
  const filters = parseProspectFilters(params);
  const view = parseProspectListView(params);
  const query = {
    q: params.q,
    status: params.status,
    owner: isSales ? undefined : params.owner,
    sort: view.sort !== "updated" ? view.sort : undefined,
  };

  const [prospects, options] = await Promise.all([
    listProspects(session, {
      q: filters.q,
      ownerId: isSales ? session.userId : filters.ownerId,
      sort: prismaProspectSort(view.sort),
      archived: false,
    }),
    getCrmOptions(session),
  ]);
  const visible =
    params.status === "uncategorized"
      ? prospects.filter((item) => !isSuiviStatusSlug(item.status.slug))
      : params.status
        ? prospects.filter((item) => item.status.slug === params.status)
        : prospects;

  const boardStatuses = SUIVI_BOARD_COLUMNS.filter((spec) => spec.slug).map((spec) => {
    const status = options.statuses.find((item) => item.slug === spec.slug);
    return { id: status?.id ?? spec.slug, name: spec.name, slug: spec.slug };
  });

  return (
    <Shell activeHref="/suivi">
      <div className="suivi-page">
        <SuiviQueryBar
          query={query}
          search={params.q ?? ""}
          statuses={boardStatuses}
          owners={options.owners}
          showOwners={!isSales}
        />
        <SuiviKanban columns={buildSuiviColumns(visible, options.statuses)} canManage={canManage} />
      </div>
    </Shell>
  );
}
