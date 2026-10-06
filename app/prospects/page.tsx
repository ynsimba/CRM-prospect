import Link from "next/link";
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
  paginateRows,
  parseProspectListView,
  prismaProspectSort,
  prospectListHref,
  sortGridRows,
} from "@/lib/prospect-list-logic";
import { listProspects } from "@/lib/prospects";
import { isAdminRole, isSalesRole } from "@/lib/roles";

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
    page?: string;
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
  // Une seule lecture pour les deux onglets : « Mes prospects » est filtré ici, ce qui donne aussi son compteur.
  const listFilters = {
    ...filters,
    ownerId: view.mine ? undefined : filters.ownerId,
    sort: prismaSort,
    archived: false,
  };
  const [prospects, unfiltered, options] = await Promise.all([
    listProspects(session, listFilters),
    // Chiffres clés et compteurs d’onglets ne doivent pas bouger quand on filtre sur un statut.
    filters.statusId ? listProspects(session, { ...listFilters, statusId: undefined }) : null,
    getCrmOptions(session),
  ]);
  const isMine = (item: (typeof prospects)[number]) =>
    item.ownerId === session.userId || item.owner?.id === session.userId;
  const scope = unfiltered ?? prospects;
  const counts = { all: scope.length, mine: scope.filter(isMine).length };
  const statRows = (view.mine ? scope.filter(isMine) : scope).map(toProspectGridRow);
  const visible = view.mine ? prospects.filter(isMine) : prospects;
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
  const paged = paginateRows(rows, params.page);
  const groups = groupGridRows(paged.items, view.group);
  const pageQuery = { ...query, page: paged.page > 1 ? String(paged.page) : undefined };

  const statusId = (slug: string) => options.statuses.find((item) => item.slug === slug)?.id;
  const countBySlug = (slug: string) => statRows.filter((row) => row.statusSlug === slug).length;
  const stats = [
    {
      tone: "green",
      icon: "bi-building",
      value: statRows.length,
      label: "Total des prospects",
      href: prospectListHref(query, { status: undefined }),
    },
    {
      tone: "pink",
      icon: "bi-person",
      value: countBySlug("lead"),
      label: "Leads",
      href: prospectListHref(query, { status: statusId("lead") }),
    },
    {
      tone: "violet",
      icon: "bi-bullseye",
      value: countBySlug("opportunite"),
      label: "Opportunités",
      href: prospectListHref(query, { status: statusId("opportunite") }),
    },
    {
      tone: "orange",
      icon: "bi-calendar-event",
      value: statRows.filter((row) => row.meetingAt).length,
      label: "Rendez-vous",
      href: prospectListHref(query, { sort: "meeting", dir: "desc" }),
    },
  ];

  return (
    <Shell activeHref="/prospects">
      <div className="prospects-sticky-page prospects-page">
        <Suspense fallback={null}>
          <CreatedProspectToast />
        </Suspense>

        <header className="pl-head">
          <div className="pl-head-copy">
            <nav className="pl-crumb" aria-label="Fil d’Ariane">
              <span>Interface Commerciale</span>
              <i className="bi bi-chevron-right" aria-hidden />
              <strong>Prospects</strong>
            </nav>
            <h1 className="pl-title">
              {view.mine ? "Mes" : "Tous les"} <em>prospects</em>
            </h1>
            <p className="pl-desc">
              {view.mine
                ? "Prospects du délégué commercial connecté"
                : "Liste de toutes nos entreprises en prospection"}
            </p>
          </div>
          <div className="pl-add">
            <Link href="/prospects/nouveau" className="pl-add-main">
              <i className="bi bi-plus-lg" aria-hidden />
              Ajouter un prospect
            </Link>
            <details className="pl-add-more">
              <summary aria-label="Autres ajouts" aria-haspopup="menu">
                <i className="bi bi-chevron-down" aria-hidden />
              </summary>
              <div className="query-pop-list" role="menu">
                <Link href="/prospects/nouveau">Ajouter un prospect</Link>
                <Link href="/contacts/nouveau">Ajouter un contact</Link>
                {canManage && !isSales ? <Link href="/import">Importer un fichier CSV</Link> : null}
              </div>
            </details>
          </div>
        </header>

        <section className="pl-stats" aria-label="Chiffres clés">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className={`pl-stat is-${stat.tone}`}>
              <span className="pl-stat-icon" aria-hidden>
                <i className={`bi ${stat.icon}`} />
              </span>
              <span className="pl-stat-copy">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </span>
              <i className={`bi ${stat.value > 0 ? "bi-graph-up-arrow" : "bi-dash-lg"} pl-stat-trend`} aria-hidden />
            </Link>
          ))}
        </section>

        <ProspectQueryBar
          query={query}
          view={view}
          search={params.q ?? ""}
          canImport={canManage}
          isSales={isSales}
          counts={counts}
          statuses={options.statuses.map((item) => ({ id: item.id, name: item.name }))}
        />

        <article className="pl-card">
          <div className="pl-card-body">
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
                    canDelete={isAdminRole(session.role)}
                    variant="commercial"
                    query={query}
                    sort={view.sort}
                    dir={view.dir}
                    filterSource={allRows}
                  />
                </div>
              ))
            )}
          </div>
          <footer className="pl-foot">
            <p>
              {paged.total === 0
                ? "Aucun résultat"
                : `Affichage de ${paged.from} à ${paged.to} sur ${paged.total} résultat${paged.total > 1 ? "s" : ""}`}
            </p>
            <nav className="pl-pager" aria-label="Pagination">
              <PagerLink
                href={prospectListHref(pageQuery, { page: paged.page > 2 ? String(paged.page - 1) : undefined })}
                disabled={paged.page <= 1}
                label="Page précédente"
                icon="bi-chevron-left"
              />
              <span className="pl-pager-current" aria-current="page">
                {paged.page}
              </span>
              {paged.pages > 1 ? <span className="pl-pager-total">sur {paged.pages}</span> : null}
              <PagerLink
                href={prospectListHref(pageQuery, { page: String(paged.page + 1) })}
                disabled={paged.page >= paged.pages}
                label="Page suivante"
                icon="bi-chevron-right"
              />
            </nav>
          </footer>
        </article>
      </div>
    </Shell>
  );
}

function PagerLink({ href, disabled, label, icon }: { href: string; disabled: boolean; label: string; icon: string }) {
  if (disabled) {
    return (
      <span className="pl-pager-btn is-disabled" aria-label={label} aria-disabled="true">
        <i className={`bi ${icon}`} aria-hidden />
      </span>
    );
  }
  return (
    <Link href={href} className="pl-pager-btn" aria-label={label} scroll={false}>
      <i className={`bi ${icon}`} aria-hidden />
    </Link>
  );
}
