"use client";

import { type ReactNode, type SyntheticEvent } from "react";
import Link from "next/link";
import { closeMenuOnSelect, keepSingleMenu, QUERY_TOOLBAR_MENU } from "@/components/close-menu";
import {
  PROSPECT_DENSITIES,
  PROSPECT_GROUPS,
  PROSPECT_SORTS,
  prospectListHref,
  type ProspectListView,
} from "@/lib/prospect-list-logic";

type Query = Record<string, string | undefined>;

/** Filtres posés depuis les en-têtes de colonnes ou le menu « Filtres ». */
const FILTER_KEYS = ["status", "company", "industry", "address", "lastAction", "meeting", "notes", "followUp", "owner"];

export default function ProspectQueryBar({
  query,
  view,
  search,
  canImport,
  isSales,
  counts,
  statuses,
}: {
  query: Query;
  view: ProspectListView;
  search: string;
  canImport: boolean;
  isSales: boolean;
  counts: { all: number; mine: number };
  statuses: { id: string; name: string }[];
}) {
  const activeFilters = FILTER_KEYS.filter((key) => query[key]).length;
  const cleared = Object.fromEntries(FILTER_KEYS.map((key) => [key, undefined]));

  return (
    <div className="pl-toolbar">
      <div className="pl-tabs" role="tablist" aria-label="Périmètre des prospects">
        <Link
          href={prospectListHref(query, { mine: undefined })}
          className={`pl-tab ${view.mine ? "" : "active"}`}
          role="tab"
          aria-selected={!view.mine}
        >
          <span className="pl-tab-icon" aria-hidden>
            <i className="bi bi-building" />
          </span>
          Tous les prospects
          <span className="pl-tab-count">{counts.all}</span>
        </Link>
        <Link
          href={prospectListHref(query, { mine: "1" })}
          className={`pl-tab ${view.mine ? "active" : ""}`}
          role="tab"
          aria-selected={view.mine}
        >
          <span className="pl-tab-icon" aria-hidden>
            <i className="bi bi-person" />
          </span>
          Mes prospects
          <span className="pl-tab-count">{counts.mine}</span>
        </Link>
      </div>

      <div className="query-actions pl-actions">
        <form method="get" className="pl-search" role="search">
          {Object.entries(query).map(([key, value]) =>
            value && key !== "q" ? <input key={key} type="hidden" name={key} value={value} /> : null,
          )}
          <i className="bi bi-search" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Rechercher un prospect…"
            aria-label="Rechercher un prospect"
          />
          {search ? (
            <Link
              href={prospectListHref(query, { q: undefined })}
              className="pl-search-clear"
              aria-label="Effacer la recherche"
            >
              <i className="bi bi-x-lg" aria-hidden />
            </Link>
          ) : null}
        </form>

        <QueryMenu icon="bi-funnel" label="Filtres" badge={activeFilters} active={activeFilters > 0}>
          <p className="grid-th-sort-label">Statut</p>
          <Link href={prospectListHref(query, { status: undefined })} className={!query.status ? "is-current" : ""}>
            Tous les statuts
          </Link>
          {statuses.map((status) => (
            <Link
              key={status.id}
              href={prospectListHref(query, { status: status.id })}
              className={query.status === status.id ? "is-current" : ""}
            >
              {status.name}
            </Link>
          ))}
          <p className="grid-th-sort-label">Relance</p>
          <Link
            href={prospectListHref(query, { followUp: query.followUp === "1" ? undefined : "1" })}
            className={query.followUp === "1" ? "is-current" : ""}
          >
            Relance nécessaire
          </Link>
          {activeFilters > 0 ? (
            <Link href={prospectListHref(query, cleared)} className="pl-menu-reset">
              <i className="bi bi-arrow-counterclockwise" aria-hidden />
              Réinitialiser les filtres
            </Link>
          ) : null}
        </QueryMenu>

        <QueryMenu icon="bi-sort-down" label="Trier" active={view.sort !== "updated"}>
          {PROSPECT_SORTS.map((item) => (
            <Link
              key={item.value}
              href={prospectListHref(query, {
                sort: item.value === "updated" ? undefined : item.value,
                dir: undefined,
              })}
              className={view.sort === item.value ? "is-current" : ""}
            >
              {item.label}
            </Link>
          ))}
        </QueryMenu>

        <QueryMenu icon="bi-list-ul" label="Grouper" active={Boolean(view.group)}>
          {PROSPECT_GROUPS.map((item) => (
            <Link
              key={item.value || "none"}
              href={prospectListHref(query, { group: item.value || undefined })}
              className={view.group === item.value ? "is-current" : ""}
            >
              {item.label}
            </Link>
          ))}
        </QueryMenu>

        <QueryMenu icon="bi-three-dots" title="Plus d’actions" active={view.density !== "medium"}>
          <p className="grid-th-sort-label">Hauteur des lignes</p>
          {PROSPECT_DENSITIES.map((item) => (
            <Link
              key={item.value}
              href={prospectListHref(query, { density: item.value === "medium" ? undefined : item.value })}
              className={view.density === item.value ? "is-current" : ""}
              scroll={false}
            >
              {item.label}
            </Link>
          ))}
          <p className="grid-th-sort-label">Données</p>
          <Link href="/prospects/export">Exporter CSV</Link>
          {canImport && !isSales ? <Link href="/import">Importer</Link> : null}
        </QueryMenu>
      </div>
    </div>
  );
}

function QueryMenu({
  icon,
  label,
  title,
  badge,
  active,
  children,
}: {
  icon: string;
  label?: string;
  title?: string;
  badge?: number;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className={`query-pop pl-menu ${label ? "" : "is-icon"} ${active ? "is-active" : ""}`}
      name={QUERY_TOOLBAR_MENU}
      onToggle={(event: SyntheticEvent<HTMLDetailsElement>) => keepSingleMenu(event)}
    >
      <summary aria-label={title ?? label} aria-haspopup="menu">
        <i className={`bi ${icon}`} aria-hidden />
        {label}
        {badge ? <span className="pl-menu-badge">{badge}</span> : null}
      </summary>
      <div className="query-pop-list" role="menu" onClick={closeMenuOnSelect}>
        {children}
      </div>
    </details>
  );
}
