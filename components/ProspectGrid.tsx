"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import DateField from "@/components/DateField";
import { closeMenuOnSelect } from "@/components/close-menu";
import { deleteProspectAction, updateProspectRowAction } from "@/app/actions/prospects";
import { initialsFromName, statusPillClass } from "@/lib/crm";
import { toCsv } from "@/lib/csv";
import {
  COMMERCIAL_GRID_COLUMNS,
  GRID_COL_WIDTHS,
  formatShortDate,
  gridColumnOptions,
  prospectListHref,
  toDateInput,
  toneIndex,
  type GridColumnKey,
  type GridFilterOption,
  type GridRowLike,
} from "@/lib/prospect-list-logic";

export type ProspectGridRow = {
  id: string;
  href: string;
  displayCode: string;
  companyName: string;
  industry: string;
  address: string;
  city: string;
  size: string;
  lastActionAt: string | null;
  meetingAt: string | null;
  statusId: string;
  statusName: string;
  statusSlug: string;
  isConverted: boolean;
  isLost: boolean;
  notes: string;
  ownerId: string;
  ownerName: string;
  needsFollowUp: boolean;
  relanceLabel: string;
  dormantLabel: string;
  archivedLabel: string;
};

type Option = { id: string; name: string };

type ProspectGridProps = {
  rows: ProspectGridRow[];
  statuses: Option[];
  owners: Option[];
  density: "compact" | "medium" | "comfortable";
  canManage: boolean;
  canReassign?: boolean;
  /** Réservé aux administrateurs : ajoute « Supprimer » au menu d’actions de la ligne. */
  canDelete?: boolean;
  variant?: "full" | "commercial";
  query?: Record<string, string | undefined>;
  sort?: string;
  dir?: "asc" | "desc";
  filterSource?: GridRowLike[];
};

export default function ProspectGrid({
  rows,
  statuses,
  owners,
  density,
  canManage,
  canReassign = false,
  canDelete = false,
  variant = "full",
  query,
  sort,
  dir,
  filterSource,
}: ProspectGridProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const commercial = variant === "commercial";
  const source = filterSource ?? rows;
  const filterable = Boolean(query);

  function col(column: GridColumnKey) {
    return {
      className: `col-${column}`,
      style: {
        width: GRID_COL_WIDTHS[column],
        minWidth: GRID_COL_WIDTHS[column],
      },
    };
  }

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row.id));

  function exportSelection() {
    const picked = rows.filter((row) => selected.includes(row.id));
    const csv = toCsv(
      ["Entreprise", "Secteur", "Adresse", "Dernière action", "Date RDV", "Statut", "Commentaire statut", "Responsable"],
      picked.map((row) => [
        row.companyName,
        row.industry,
        row.address,
        formatShortDate(row.lastActionAt),
        row.meetingAt ? formatShortDate(row.meetingAt) : "",
        row.statusName,
        row.notes,
        row.ownerName,
      ]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "prospects-selection.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function head(column: (typeof COMMERCIAL_GRID_COLUMNS)[number]) {
    const colProps = col(column.key);
    if (!filterable || !query) return <th {...colProps}>{column.label}</th>;
    const extras = {
      statuses: statuses.map((item) => ({ value: item.id, label: item.name })),
      owners: owners.map((item) => ({ value: item.id, label: item.name })),
    };
    return (
      <ColumnHead
        column={column}
        query={query}
        sort={sort ?? "updated"}
        dir={dir ?? "desc"}
        options={gridColumnOptions(column.filter, source, extras)}
        colProps={colProps}
      />
    );
  }

  return (
    <div className={`table-wrap${commercial ? " is-grid-scroll" : ""}`}>
      {commercial && selected.length > 0 ? (
        <div className="grid-selection" role="status">
          <strong>
            {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
          </strong>
          <button type="button" onClick={exportSelection}>
            <i className="bi bi-download" aria-hidden />
            Exporter la sélection
          </button>
          <button type="button" onClick={() => setSelected([])}>
            Tout désélectionner
          </button>
        </div>
      ) : null}
      <table className={`data-table prospect-grid density-${density}${commercial ? " is-commercial" : ""}`}>
        <thead>
          <tr>
            {commercial ? (
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? rows.map((row) => row.id) : [])}
                  aria-label="Tout sélectionner"
                />
              </th>
            ) : (
              <th className="col-check">
                <span className="visually-hidden">Sélection</span>
              </th>
            )}
            {commercial ? null : <th>ID</th>}
            {head(COMMERCIAL_GRID_COLUMNS[0])}
            {head(COMMERCIAL_GRID_COLUMNS[1])}
            {head(COMMERCIAL_GRID_COLUMNS[2])}
            {commercial ? null : <th>Ville</th>}
            {commercial ? null : <th>Taille</th>}
            {head(COMMERCIAL_GRID_COLUMNS[3])}
            {head(COMMERCIAL_GRID_COLUMNS[4])}
            {head(COMMERCIAL_GRID_COLUMNS[5])}
            {head(COMMERCIAL_GRID_COLUMNS[6])}
            {head(COMMERCIAL_GRID_COLUMNS[7])}
            {head(COMMERCIAL_GRID_COLUMNS[8])}
            {commercial ? (
              <th className="col-actions">Actions</th>
            ) : (
              <>
                <th>Prospect dormant</th>
                <th>Archivé</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const active = selected.includes(row.id);
            return (
              <tr key={row.id} className={active ? "is-active" : ""}>
                <td className="col-check">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) => toggle(row.id, event.target.checked)}
                    aria-label={`Sélectionner ${row.companyName}`}
                  />
                </td>
                {commercial ? null : <td>{row.displayCode || "—"}</td>}
                <td {...col("company")}>
                  {commercial ? (
                    <Link href={row.href} className="company-cell is-linked" title={`Ouvrir ${row.companyName}`}>
                      <span className={`company-avatar tone-${toneIndex(row.companyName, 6)}`} aria-hidden>
                        {row.companyName.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <strong>{row.companyName}</strong>
                    </Link>
                  ) : (
                    <div className="company-cell">
                      <strong>{row.companyName}</strong>
                      <Link href={row.href} className="row-open">
                        Ouvrir <i className="bi bi-chevron-right" aria-hidden />
                      </Link>
                    </div>
                  )}
                </td>
                <td {...col("industry")}>
                  {commercial && row.industry ? (
                    <span className={`sector-tag tone-${toneIndex(row.industry, 5)}`}>{row.industry}</span>
                  ) : (
                    row.industry || "—"
                  )}
                </td>
                <td {...col("address")} className={`${col("address").className} cell-ellipsis`}>
                  {commercial && row.address ? <i className="bi bi-geo-alt cell-icon" aria-hidden /> : null}
                  {row.address || "—"}
                </td>
                {commercial ? null : <td>{row.city || "—"}</td>}
                {commercial ? null : <td>{row.size || "—"}</td>}
                <td {...col("lastAction")}>
                  {commercial ? <i className="bi bi-calendar4 cell-icon" aria-hidden /> : null}
                  {formatShortDate(row.lastActionAt)}
                </td>
                <td {...col("meeting")} data-label="RDV">
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <DateField
                        name="nextContactAt"
                        defaultValue={toDateInput(row.meetingAt)}
                        variant="cell"
                        className="cell-edit"
                        ariaLabel={`Date RDV ${row.companyName}`}
                        placeholder="—"
                        submitOnChange
                      />
                    </form>
                  ) : (
                    formatShortDate(row.meetingAt)
                  )}
                </td>
                <td {...col("status")}>
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <div className="overlay-field">
                        <span className={`status-pill ${statusPillClass(row.statusSlug, row.isConverted, row.isLost)}`}>
                          {row.statusName}
                        </span>
                        <select
                          className="overlay-control"
                          name="statusId"
                          defaultValue={row.statusId}
                          aria-label={`Statut ${row.companyName}`}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        >
                          {statuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </form>
                  ) : (
                    <span className={`status-pill ${statusPillClass(row.statusSlug, row.isConverted, row.isLost)}`}>
                      {row.statusName}
                    </span>
                  )}
                </td>
                <td {...col("notes")} data-label="Commentaire">
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <input
                        className="cell-edit"
                        name="notes"
                        defaultValue={row.notes}
                        placeholder="—"
                        aria-label={`Commentaire ${row.companyName}`}
                        onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      />
                    </form>
                  ) : (
                    (row.notes || "—")
                  )}
                </td>
                <td {...col("owner")}>
                  {canReassign ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <div className="overlay-field">
                        <span className="owner-pill">
                          <span className="owner-avatar" aria-hidden>
                            {initialsFromName(row.ownerName) || "?"}
                          </span>
                          {row.ownerName || "—"}
                        </span>
                        <select
                          className="overlay-control"
                          name="ownerId"
                          defaultValue={row.ownerId}
                          aria-label={`Commercial ${row.companyName}`}
                          onChange={(event) => event.currentTarget.form?.requestSubmit()}
                        >
                          <option value="">Non assigné</option>
                          {owners.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                              {owner.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </form>
                  ) : (
                    <span className="owner-pill">
                      <span className="owner-avatar" aria-hidden>
                        {initialsFromName(row.ownerName) || "?"}
                      </span>
                      {row.ownerName || "—"}
                    </span>
                  )}
                </td>
                <td {...col("followUp")} data-label="Relance">
                  {commercial && !row.needsFollowUp ? (
                    <span className="cell-dash">—</span>
                  ) : (
                    <div className="follow-alert truncate-1">
                      {row.needsFollowUp ? row.relanceLabel || "⚠️ Relance nécessaire" : ""}
                    </div>
                  )}
                </td>
                {commercial ? (
                  <td className="col-actions">
                    <details className="row-menu" name="prospect-row">
                      <summary aria-label={`Actions ${row.companyName}`} aria-haspopup="menu">
                        <i className="bi bi-three-dots-vertical" aria-hidden />
                      </summary>
                      <div className="query-pop-list" role="menu" onClick={closeMenuOnSelect}>
                        <Link href={row.href}>
                          <i className="bi bi-box-arrow-up-right" aria-hidden />
                          Ouvrir la fiche
                        </Link>
                        {canDelete ? (
                          <form
                            action={deleteProspectAction.bind(null, row.id)}
                            onSubmit={(event) => {
                              const ok = window.confirm(
                                `Supprimer définitivement « ${row.companyName} » ?\n\nCette action est irréversible.`,
                              );
                              if (!ok) event.preventDefault();
                            }}
                          >
                            <button type="submit" className="is-danger">
                              <i className="bi bi-trash3" aria-hidden />
                              Supprimer
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </details>
                  </td>
                ) : (
                  <>
                    <td>{row.dormantLabel || "—"}</td>
                    <td>{row.archivedLabel || "—"}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ColumnHead({
  column,
  query,
  sort,
  dir,
  options,
  colProps,
}: {
  column: (typeof COMMERCIAL_GRID_COLUMNS)[number];
  query: Record<string, string | undefined>;
  sort: string;
  dir: "asc" | "desc";
  options: GridFilterOption[];
  colProps: { className: string; style: CSSProperties };
}) {
  const filterKey = column.filter;
  const activeFilter = filterKey ? query[filterKey] : undefined;
  const sorted = sort === column.sort;
  const dated = column.sort === "lastAction" || column.sort === "meeting";

  return (
    <th
      className={`grid-th${activeFilter || sorted ? " is-active" : ""} ${colProps.className}`}
      style={colProps.style}
    >
      <details className="grid-th-pop" name="prospect-col">
        <summary aria-label={`Filtrer ${column.label}`}>
          <span>{column.label}</span>
          <i
            className={`bi ${sorted ? (dir === "asc" ? "bi-caret-up-fill" : "bi-caret-down-fill") : dated || column.key === "industry" || column.key === "owner" ? "bi-chevron-expand" : "bi-chevron-down"}`}
            aria-hidden
          />
        </summary>
        <div className="query-pop-list" onClick={closeMenuOnSelect}>
          {filterKey ? (
            <Link
              href={prospectListHref(query, { [filterKey]: undefined })}
              className={!activeFilter ? "is-current" : ""}
            >
              Tous
            </Link>
          ) : null}
          {options.map((item) => (
            <Link
              key={`${column.key}-${item.value}`}
              href={prospectListHref(query, { [filterKey]: item.value })}
              className={activeFilter === item.value ? "is-current" : ""}
            >
              {item.label}
            </Link>
          ))}
          <p className="grid-th-sort-label">Trier</p>
          <Link
            href={prospectListHref(query, { sort: column.sort, dir: "asc" })}
            className={sorted && dir === "asc" ? "is-current" : ""}
          >
            {dated ? "Plus ancien" : "Trier A → Z"}
          </Link>
          <Link
            href={prospectListHref(query, { sort: column.sort, dir: "desc" })}
            className={sorted && dir === "desc" ? "is-current" : ""}
          >
            {dated ? "Plus récent" : "Trier Z → A"}
          </Link>
        </div>
      </details>
    </th>
  );
}
