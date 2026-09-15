"use client";

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import Link from "next/link";
import { closeMenuOnSelect, closeMenusIn, keepSingleMenu, QUERY_TOOLBAR_MENU } from "@/components/close-menu";
import AddProspectConfirm from "@/components/AddProspectConfirm";
import { SUIVI_SORTS, suiviHref } from "@/lib/suivi-logic";

type Query = Record<string, string | undefined>;

export default function SuiviQueryBar({
  query,
  search,
  statuses,
  owners,
  showOwners,
}: {
  query: Query;
  search: string;
  statuses: Array<{ id: string; name: string; slug: string }>;
  owners: Array<{ id: string; name: string }>;
  showOwners: boolean;
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
    <header className="suivi-head">
      <div className="suivi-head-copy">
        <nav className="suivi-crumb" aria-label="Fil d’Ariane">
          <span>Interface Commerciale</span>
          <i className="bi bi-chevron-right" aria-hidden />
          <strong>Suivi Prospect</strong>
        </nav>
        <p className="suivi-desc">Vue permettant un follow up des prospect</p>
      </div>

      <div className="suivi-actions" ref={actionsRef}>
        <QueryMenu label="Filtre" title="Filtre" onToggle={onMenuToggle}>
          <Link href={suiviHref(query, { status: undefined, owner: undefined })} className={!query.status && !query.owner ? "is-current" : ""}>
            Tous
          </Link>
          <Link
            href={suiviHref(query, { status: "uncategorized" })}
            className={query.status === "uncategorized" ? "is-current" : ""}
          >
            Non catégorisée
          </Link>
          {statuses.map((status) => (
            <Link
              key={status.id}
              href={suiviHref(query, { status: status.slug })}
              className={query.status === status.slug ? "is-current" : ""}
            >
              {status.name}
            </Link>
          ))}
          {showOwners
            ? owners.map((owner) => (
                <Link
                  key={owner.id}
                  href={suiviHref(query, { owner: owner.id })}
                  className={query.owner === owner.id ? "is-current" : ""}
                >
                  {owner.name}
                </Link>
              ))
            : null}
        </QueryMenu>

        <QueryMenu label="Trier" title="Trier" onToggle={onMenuToggle}>
          {SUIVI_SORTS.map((item) => (
            <Link
              key={item.value}
              href={suiviHref(query, { sort: item.value === "updated" ? undefined : item.value })}
              className={(query.sort || "updated") === item.value ? "is-current" : ""}
            >
              {item.label}
            </Link>
          ))}
        </QueryMenu>

        <form method="get" className={`query-search ${searchOpen ? "is-open" : ""}`}>
          {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
          {query.owner ? <input type="hidden" name="owner" value={query.owner} /> : null}
          {query.sort ? <input type="hidden" name="sort" value={query.sort} /> : null}
          <button
            type="button"
            className="query-icon-btn"
            aria-label="Rechercher"
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
            placeholder="Rechercher"
            aria-label="Rechercher"
            tabIndex={searchOpen ? 0 : -1}
          />
          {searchOpen ? (
            <Link
              href={suiviHref(query, { q: undefined })}
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
            <Link href="/archives">Archives</Link>
          </div>
        </details>

        <AddProspectConfirm />
      </div>
    </header>
  );
}

function QueryMenu({
  label,
  title,
  onToggle,
  children,
}: {
  label: string;
  title: string;
  onToggle?: (event: SyntheticEvent<HTMLDetailsElement>) => void;
  children: ReactNode;
}) {
  return (
    <details className="query-pop" name={QUERY_TOOLBAR_MENU} onToggle={onToggle}>
      <summary aria-label={title} aria-haspopup="menu">
        {label}
      </summary>
      <div className="query-pop-list" onClick={closeMenuOnSelect}>{children}</div>
    </details>
  );
}
