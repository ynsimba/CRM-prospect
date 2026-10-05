import Shell from "@/components/Shell";
import CreatedProspectToast from "@/components/CreatedProspectToast";
import ProspectGrid from "@/components/ProspectGrid";
import ProspectQueryBar from "@/components/ProspectQueryBar";
import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { parseProspectFilters } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { toProspectGridRow } from "@/lib/prospect-grid-row";
import {
  filterGridRows,
  groupGridRows,
  parseProspectListView,
  prismaProspectSort,
  sortGridRows,
} from "@/lib/prospect-list-logic";
import { listProspects } from "@/lib/prospects";
import { isSalesRole } from "@/lib/roles";

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    source?: string;
    owner?: string;
    tag?: string;
    priority?: string;
    city?: string;
    score?: string;
    mine?: string;
    group?: string;
    sort?: string;
    dir?: string;
    density?: string;
    company?: string;
    industry?: string;
    address?: string;
    lastAction?: string;
    meeting?: string;
    notes?: string;
    followUp?: string;
    created?: string;
  }>;
}) {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const isSales = isSalesRole(session.role);
  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const params = await searchParams;
  const filters = parseProspectFilters(params);
  const view = parseProspectListView(params);
  const prismaSort = prismaProspectSort(view.sort);
  const query = {
    q: params.q,
    status: params.status,
    source: params.source,
    owner: view.mine ? undefined : params.owner,
    tag: params.tag,
    priority: params.priority,
    city: params.city,
    score: params.score,
    mine: view.mine ? "1" : undefined,
    group: view.group || undefined,
    sort: view.sort !== "updated" ? view.sort : undefined,
    dir: params.dir,
    density: view.density !== "medium" ? view.density : undefined,
    company: params.company,
    industry: params.industry,
    address: params.address,
    lastAction: params.lastAction,
    meeting: params.meeting,
    notes: params.notes,
    followUp: params.followUp,
  };
  const [prospects, options] = await Promise.all([
    listProspects(session, {
      ...filters,
      mine: view.mine,
      ownerId: view.mine ? session.userId : filters.ownerId,
      sort: prismaSort,
      archived: false,
    }),
    getCrmOptions(session),
  ]);
  const visible = view.mine
    ? prospects.filter((item) => item.ownerId === session.userId || item.owner?.id === session.userId)
    : prospects;
  const allRows = visible.map(toProspectGridRow);
  const rows = sortGridRows(
    filterGridRows(allRows, {
      company: params.company,
      industry: params.industry,
      address: params.address,
      lastAction: params.lastAction,
      meeting: params.meeting,
      notes: params.notes,
      followUp: params.followUp,
      status: params.status,
      owner: view.mine ? undefined : params.owner,
    }),
    view.sort,
    view.dir,
  );
  const groups = groupGridRows(rows, view.group);

  return (
    <Shell activeHref="/prospects">
      <Suspense fallback={null}>
        <CreatedProspectToast />
      </Suspense>
      <ProspectQueryBar
        query={query}
        view={view}
        search={params.q ?? ""}
        canImport={canManage}
        isSales={isSales}
      />

      <article className="dash-card query-grid">
        {rows.length === 0 ? (
          <p className="empty-copy">Aucun prospect pour ces critères.</p>
        ) : (
          groups.map((group) => (
            <div key={group.key || "all"} className="prospect-group">
              {group.label ? (
                <h3 className="group-label">
                  {group.label}
                  <span>{group.items.length}</span>
                </h3>
              ) : null}
              <ProspectGrid
                rows={group.items}
                statuses={options.statuses}
                owners={options.owners}
                density={view.density}
                canManage={canManage}
                canReassign={!isSales}
                variant="commercial"
                query={query}
                sort={view.sort}
                dir={view.dir}
                filterSource={allRows}
              />
            </div>
          ))
        )}
      </article>
    </Shell>
  );
}
