"use client";

import { useState } from "react";
import Link from "next/link";
import { updateProspectRowAction } from "@/app/actions/prospects";
import { initialsFromName, statusPillClass } from "@/lib/crm";
import { formatShortDate, toDateInput } from "@/lib/prospect-list-logic";

export type ProspectGridRow = {
  id: string;
  href: string;
  companyName: string;
  industry: string;
  address: string;
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
};

type Option = { id: string; name: string };

type ProspectGridProps = {
  rows: ProspectGridRow[];
  statuses: Option[];
  owners: Option[];
  density: "compact" | "medium" | "comfortable";
  canManage: boolean;
};

export default function ProspectGrid({ rows, statuses, owners, density, canManage }: ProspectGridProps) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string, checked: boolean) {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  }

  return (
    <div className="table-wrap">
      <table className={`data-table prospect-grid density-${density}`}>
        <thead>
          <tr>
            <th className="col-check">
              <span className="visually-hidden">Sélection</span>
            </th>
            <th>Nom entreprise</th>
            <th>Secteur</th>
            <th>Adresse</th>
            <th>Date dernière action</th>
            <th>Date RDV</th>
            <th>Statut</th>
            <th>Commentaire statut</th>
            <th>Commercial responsable</th>
            <th>Alerte Relance</th>
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
                <td>
                  <div className="company-cell">
                    <strong>{row.companyName}</strong>
                    <Link href={row.href} className="row-open">
                      Ouvrir <i className="bi bi-chevron-right" aria-hidden />
                    </Link>
                  </div>
                </td>
                <td>{row.industry || "—"}</td>
                <td>{row.address || "—"}</td>
                <td>{formatShortDate(row.lastActionAt)}</td>
                <td>
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <span className="cell-static">{formatShortDate(row.meetingAt)}</span>
                      <input
                        className="cell-edit"
                        type="date"
                        name="nextContactAt"
                        defaultValue={toDateInput(row.meetingAt)}
                        aria-label={`Date RDV ${row.companyName}`}
                        onChange={(event) => event.currentTarget.form?.requestSubmit()}
                      />
                    </form>
                  ) : (
                    formatShortDate(row.meetingAt)
                  )}
                </td>
                <td>
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <span className={`status-pill cell-static ${statusPillClass(row.statusSlug, row.isConverted, row.isLost)}`}>
                        {row.statusName}
                      </span>
                      <select
                        className="cell-edit grid-select"
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
                    </form>
                  ) : (
                    <span className={`status-pill ${statusPillClass(row.statusSlug, row.isConverted, row.isLost)}`}>
                      {row.statusName}
                    </span>
                  )}
                </td>
                <td>
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="ownerId" value={row.ownerId} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <span className="cell-static">{row.notes || "—"}</span>
                      <input
                        className="cell-edit"
                        name="notes"
                        defaultValue={row.notes}
                        placeholder="Commentaire"
                        aria-label={`Commentaire ${row.companyName}`}
                        onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                      />
                    </form>
                  ) : (
                    (row.notes || "—")
                  )}
                </td>
                <td>
                  {canManage ? (
                    <form action={updateProspectRowAction.bind(null, row.id)}>
                      <input type="hidden" name="statusId" value={row.statusId} />
                      <input type="hidden" name="notes" value={row.notes} />
                      <input type="hidden" name="nextContactAt" value={toDateInput(row.meetingAt)} />
                      <span className="cell-static owner-cell">
                        <span className="owner-avatar" aria-hidden>
                          {initialsFromName(row.ownerName) || "?"}
                        </span>
                        {row.ownerName || "—"}
                      </span>
                      <select
                        className="cell-edit grid-select"
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
                    </form>
                  ) : (
                    <span className="owner-cell">
                      <span className="owner-avatar" aria-hidden>
                        {initialsFromName(row.ownerName) || "?"}
                      </span>
                      {row.ownerName || "—"}
                    </span>
                  )}
                </td>
                <td>
                  {row.needsFollowUp ? (
                    <span className="follow-alert">
                      <i className="bi bi-exclamation-triangle-fill" aria-hidden />
                      Relance nécessaire
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
