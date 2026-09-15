"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProspectRowAction } from "@/app/actions/prospects";
import { statusPillClass } from "@/lib/crm";
import {
  dashboardProspectTableColumns,
  type DashboardKpiDetailRow,
} from "@/lib/dashboard-logic";

type RelanceKpiTableProps = {
  items: DashboardKpiDetailRow[];
  onSaved?: () => void;
  showOwner?: boolean;
  commentPlaceholder?: string;
  refreshOnSave?: boolean;
};

export default function RelanceKpiTable({
  items,
  onSaved,
  showOwner = false,
  commentPlaceholder = "Saisir une action…",
  refreshOnSave = false,
}: RelanceKpiTableProps) {
  const router = useRouter();
  const columns = dashboardProspectTableColumns(showOwner);

  async function save(row: DashboardKpiDetailRow, formData: FormData) {
    await updateProspectRowAction(row.id, formData);
    if (refreshOnSave) router.refresh();
    onSaved?.();
  }

  return (
    <div className="table-wrap metric-drawer-table-wrap">
      <table className="data-table metric-drawer-table">
        <thead>
          <tr>
            {columns.map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.id}>
              <td>
                <Link href={row.href} className="metric-drawer-company">
                  {row.title}
                </Link>
              </td>
              {showOwner ? <td>{row.owner}</td> : null}
              <td>
                <span className={`status-pill ${statusPillClass(row.statusSlug, row.isConverted, row.isLost)}`}>
                  {row.status}
                </span>
              </td>
              <td>
                <form action={async (formData) => save(row, formData)}>
                  <input type="hidden" name="statusId" value={row.statusId} />
                  <input type="hidden" name="ownerId" value={row.ownerId} />
                  <input type="hidden" name="nextContactAt" value={row.meetingAt} />
                  <input
                    key={`${row.id}-${row.action}`}
                    className="cell-edit"
                    name="notes"
                    defaultValue={row.action}
                    placeholder={commentPlaceholder}
                    aria-label={`Commentaire ${row.title}`}
                    onBlur={(event) => {
                      if (event.currentTarget.value === row.action) return;
                      event.currentTarget.form?.requestSubmit();
                    }}
                  />
                </form>
              </td>
              <td>{row.lastAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
