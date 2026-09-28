"use client";

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import Link from "next/link";
import { closeMenuOnSelect, closeMenusIn, keepSingleMenu, QUERY_TOOLBAR_MENU } from "@/components/close-menu";
import {
  PROSPECT_DENSITIES,
  PROSPECT_GROUPS,
  PROSPECT_SORTS,
  prospectListHref,
  type ProspectListView,
} from "@/lib/prospect-list-logic";

type Query = Record<string, string | undefined>;

export default function ProspectQueryBar({
  query,
  view,
  search,
  canImport,
  isSales,
}: {
  query: Query;
  view: ProspectListView;
  search: string;
  canImport: boolean;
  isSales: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const searchRef = useRef<HTMLInputElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function onMenuToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    keepSingleMenu(event);
    if (event.currentTarget.open) setSearchOpen(false);
  }

  return (
    <div className="query-container">
      <nav className="query-crumb" aria-label="Fil d’Ariane">
        <span>Interface Commerciale</span>
        <i className="bi bi-chevron-right" aria-hidden />
        <strong>{view.mine ? "Mes prospects" : "Tous les prospects"}</strong>
      </nav>
      <h1 className="query-heading">{view.mine ? "Mes prospects" : "Tous les prospects"}</h1>
      <p className="query-desc">
        {view.mine
          ? "Prospects du délégué commercial connecté"
          : "Liste de toutes nos entreprises en prospection"}
      </p>

      <div className="query-toolbar">
        <div className="query-tabs" role="tablist" aria-label="Périmètre des prospects">
          <Link
            href={prospectListHref(query, { mine: undefined })}
            className={`query-tab ${view.mine ? "" : "active"}`}
            role="tab"
            aria-selected={!view.mine}
          >
            Tous les Prospects
          </Link>
          <Link
            href={prospectListHref(query, { mine: "1" })}
            className={`query-tab ${view.mine ? "active" : ""}`}
            role="tab"
            aria-selected={view.mine}
          >
            Mes Prospects
          </Link>
        </div>

        <div className="query-actions" ref={actionsRef}>
          <QueryMenu label="Grouper" title="Grouper" onToggle={onMenuToggle}>
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

          <QueryMenu label="Trier" title="Trier" onToggle={onMenuToggle}>
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

          <QueryMenu
            label={<i className="bi bi-text-paragraph" aria-hidden />}
            title="Hauteur des lignes"
            icon
            active={view.density !== "medium"}
            onToggle={onMenuToggle}
          >
            {PROSPECT_DENSITIES.map((item) => (
              <Link
                key={item.value}
                href={prospectListHref(query, { density: item.value === "medium" ? undefined : item.value })}
                className={view.density === item.value ? "is-current" : ""}
                role="menuitem"
                scroll={false}
              >
                {item.label}
              </Link>
            ))}
          </QueryMenu>

          <form
            method="get"
            className={`query-search ${searchOpen ? "is-open" : ""}`}
            onSubmit={() => setSearchOpen(true)}
          >
            {view.mine ? <input type="hidden" name="mine" value="1" /> : null}
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            {query.source ? <input type="hidden" name="source" value={query.source} /> : null}
            {query.owner && !view.mine ? <input type="hidden" name="owner" value={query.owner} /> : null}
            {query.tag ? <input type="hidden" name="tag" value={query.tag} /> : null}
            {query.priority ? <input type="hidden" name="priority" value={query.priority} /> : null}
            {query.city ? <input type="hidden" name="city" value={query.city} /> : null}
            {query.score ? <input type="hidden" name="score" value={query.score} /> : null}
            {view.group ? <input type="hidden" name="group" value={view.group} /> : null}
            {view.sort !== "updated" ? <input type="hidden" name="sort" value={view.sort} /> : null}
            {query.dir ? <input type="hidden" name="dir" value={query.dir} /> : null}
            {view.density !== "medium" ? <input type="hidden" name="density" value={view.density} /> : null}
            {query.company ? <input type="hidden" name="company" value={query.company} /> : null}
            {query.industry ? <input type="hidden" name="industry" value={query.industry} /> : null}
            {query.address ? <input type="hidden" name="address" value={query.address} /> : null}
            {query.lastAction ? <input type="hidden" name="lastAction" value={query.lastAction} /> : null}
            {query.meeting ? <input type="hidden" name="meeting" value={query.meeting} /> : null}
            {query.notes ? <input type="hidden" name="notes" value={query.notes} /> : null}
            {query.followUp ? <input type="hidden" name="followUp" value={query.followUp} /> : null}
            {query.pin ? <input type="hidden" name="pin" value={query.pin} /> : null}

            <button
              type="button"
              className="query-icon-btn"
              aria-label="Cliquer pour effectuer une recherche"
              onClick={() => {
                closeMenusIn(actionsRef.current);
                setSearchOpen(true);
              }}
            >
              <i className="bi bi-search" aria-hidden />
            </button>
            <input
              ref={searchRef}
              name="q"
              defaultValue={search}
              placeholder="Rechercher entreprises"
              aria-label="Rechercher entreprises"
              tabIndex={searchOpen ? 0 : -1}
            />
            {searchOpen ? (
              <Link
                href={prospectListHref(query, { q: undefined })}
                className="query-search-clear"
                aria-label="Effacer la recherche"
                onClick={() => setSearchOpen(false)}
              >
                <i className="bi bi-x" aria-hidden />
              </Link>
            ) : null}
          </form>

          <details className="query-more" name={QUERY_TOOLBAR_MENU} onToggle={onMenuToggle}>
            <summary aria-label="Plus d’actions" aria-haspopup="true">
              <i className="bi bi-three-dots" aria-hidden />
            </summary>
            <div className="query-pop-list" onClick={closeMenuOnSelect}>
              <Link href="/prospects/nouveau">Ajouter un prospect</Link>
              <Link href="/prospects/export">Exporter CSV</Link>
              {canImport && !isSales ? <Link href="/import">Importer</Link> : null}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function QueryMenu({
  label,
  title,
  icon,
  active,
  onToggle,
  children,
}: {
  label: ReactNode;
  title: string;
  icon?: boolean;
  active?: boolean;
  onToggle?: (event: SyntheticEvent<HTMLDetailsElement>) => void;
  children: ReactNode;
}) {
  return (
    <details
      className={`query-pop ${icon ? "is-icon" : ""} ${active ? "is-active" : ""}`}
      name={QUERY_TOOLBAR_MENU}
      onToggle={onToggle}
    >
      <summary aria-label={title} aria-haspopup="menu">
        {label}
      </summary>
      <div className="query-pop-list" role="menu" onClick={closeMenuOnSelect}>
        {children}
      </div>
    </details>
  );
}
