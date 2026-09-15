import Link from "next/link";
import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { PRIORITY_LABELS, fullName, priorityPillClass, statusPillClass } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import { listProspects } from "@/lib/prospects";

export default async function ArchivesPage() {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const prospects = await listProspects(session, { archived: true });

  return (
    <Shell activeHref="/archives">
      <div className="page-head">
        <div>
          <h1 className="page-title">Archives</h1>
          <p className="card-sub">Rejetés depuis 15 jours et finalisés depuis 30 jours.</p>
        </div>
      </div>

      <article className="dash-card">
        {prospects.length === 0 ? (
          <p className="empty-copy">Aucune archive pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Entreprise</th>
                  <th>Statut</th>
                  <th>Commercial</th>
                  <th>Priorité</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id}>
                    <td>
                      <Link href={`/prospects/${prospect.id}`}>
                        <strong>{fullName(prospect.firstName, prospect.lastName)}</strong>
                      </Link>
                      <div className="muted-line">{prospect.email ?? prospect.phone ?? prospect.city}</div>
                    </td>
                    <td>
                      {prospect.company ? (
                        <Link href={`/entreprises/${prospect.company.id}`}>{prospect.company.name}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${statusPillClass(prospect.status.slug, prospect.status.isConverted, prospect.status.isLost)}`}
                      >
                        {prospect.status.name}
                      </span>
                    </td>
                    <td>{prospect.owner?.name ?? "—"}</td>
                    <td>
                      <span className={`status-pill ${priorityPillClass(prospect.priority)}`}>
                        {PRIORITY_LABELS[prospect.priority]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </Shell>
  );
}
