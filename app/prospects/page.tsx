import Link from "next/link";
import Shell from "@/components/Shell";
import ProspectGrid, { type ProspectGridRow } from "@/components/ProspectGrid";
import { requirePermission } from "@/lib/auth";
import { fullName, parseProspectFilters } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import {
  PROSPECT_DENSITIES,
  PROSPECT_GROUPS,
  PROSPECT_SORTS,
  groupProspects,
  lastActionDate,
  needsFollowUpAlert,
  parseProspectListView,
  prospectListHref,
} from "@/lib/prospect-list-logic";
import { listProspects } from "@/lib/prospects";

function toGridRow(prospect: Awaited<ReturnType<typeof listProspects>>[number]): ProspectGridRow {
  const companyName = prospect.company?.name ?? fullName(prospect.firstName, prospect.lastName);
  const lastAction = lastActionDate({
    lastContactAt: prospect.lastContactAt,
    updatedAt: prospect.updatedAt,
    activityAt: prospect.activities[0]?.occurredAt ?? null,
  });
  const address = [prospect.company?.address ?? prospect.address, prospect.company?.city ?? prospect.city]
    .filter(Boolean)
    .join(", ");

  return {
    id: prospect.id,
    href: `/prospects/${prospect.id}`,
    companyName,
    industry: prospect.company?.industry ?? prospect.industry ?? "",
    address,
    lastActionAt: lastAction.toISOString(),
    meetingAt: prospect.nextContactAt?.toISOString() ?? null,
    statusId: prospect.statusId,
    statusName: prospect.status.name,
    statusSlug: prospect.status.slug,
    isConverted: prospect.status.isConverted,
    isLost: prospect.status.isLost,
    notes: prospect.notes ?? "",
    ownerId: prospect.owner?.id ?? "",
    ownerName: prospect.owner?.name ?? "",
    needsFollowUp: needsFollowUpAlert({
      nextContactAt: prospect.nextContactAt,
      isConverted: prospect.status.isConverted,
      isLost: prospect.status.isLost,
    }),
  };
}

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
    density?: string;
  }>;
}) {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const isSales = session.role === "SALES";
  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const params = await searchParams;
  const filters = parseProspectFilters(params);
  const view = parseProspectListView(params);
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
    density: view.density !== "medium" ? view.density : undefined,
  };
  const [prospects, options] = await Promise.all([
    listProspects(session, {
      ...filters,
      ownerId: view.mine ? session.userId : filters.ownerId,
      sort: view.sort,
      ...(isSales ? { archived: false } : {}),
    }),
    getCrmOptions(session),
  ]);
  const groups = groupProspects(prospects, view.group);

  return (
    <Shell activeHref="/prospects">
      <div className="page-head">
        <div>
          <h1 className="page-title crumb">
            <span>Interface Commerciale</span>
            <i className="bi bi-chevron-right" aria-hidden />
            <strong>Tous les prospects</strong>
          </h1>
          <p className="card-sub">Liste de toutes nos entreprises en prospection</p>
        </div>
      </div>

      <article className="dash-card prospect-module" style={{ marginBottom: 16 }}>
        <div className="module-tabs" role="tablist" aria-label="Périmètre des prospects">
          <Link
            href={prospectListHref(query, { mine: undefined })}
            className={`module-tab ${view.mine ? "" : "active"}`}
            role="tab"
            aria-selected={!view.mine}
          >
            Tous les Prospects
          </Link>
          <Link
            href={prospectListHref(query, { mine: "1" })}
            className={`module-tab ${view.mine ? "active" : ""}`}
            role="tab"
            aria-selected={view.mine}
          >
            Mes Prospects
          </Link>
        </div>

        <form method="get" className="module-toolbar">
          {view.mine ? <input type="hidden" name="mine" value="1" /> : null}
          {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
          {params.source ? <input type="hidden" name="source" value={params.source} /> : null}
          {params.owner && !view.mine ? <input type="hidden" name="owner" value={params.owner} /> : null}
          {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
          {params.priority ? <input type="hidden" name="priority" value={params.priority} /> : null}
          {params.city ? <input type="hidden" name="city" value={params.city} /> : null}
          {params.score ? <input type="hidden" name="score" value={params.score} /> : null}

          <label className="toolbar-control">
            Grouper
            <select name="group" defaultValue={view.group}>
              {PROSPECT_GROUPS.map((item) => (
                <option key={item.value || "none"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-control">
            Trier
            <select name="sort" defaultValue={view.sort}>
              {PROSPECT_SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-control">
            <i className="bi bi-text-paragraph" aria-hidden />
            <span className="visually-hidden">Hauteur des lignes</span>
            <select name="density" defaultValue={view.density} aria-label="Hauteur des lignes">
              {PROSPECT_DENSITIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="toolbar-search">
            <i className="bi bi-search" aria-hidden />
            <input name="q" defaultValue={params.q ?? ""} placeholder="Rechercher entreprises" />
          </label>
          <button type="submit" className="btn-download">
            Appliquer
          </button>
          <details className="more-menu">
            <summary aria-label="Plus d’actions">
              <i className="bi bi-three-dots" aria-hidden />
            </summary>
            <div className="more-menu-list">
              <Link href="/prospects/nouveau">Ajouter un prospect</Link>
              <Link href="/prospects/export">Exporter CSV</Link>
              {canManage && !isSales ? <Link href="/import">Importer</Link> : null}
            </div>
          </details>
        </form>
      </article>

      <article className="dash-card">
        {prospects.length === 0 ? (
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
                rows={group.items.map(toGridRow)}
                statuses={options.statuses}
                owners={options.owners}
                density={view.density}
                canManage={canManage}
              />
            </div>
          ))
        )}
      </article>
    </Shell>
  );
}
