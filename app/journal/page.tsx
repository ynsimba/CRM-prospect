import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";

export default async function JournalPage() {
  const session = await requirePermission(PERMISSIONS.settingsManage);
  const logs = await listAuditLogs(session);

  return (
    <Shell activeHref="/journal">
      <div className="page-head">
        <div>
          <h1 className="page-title">Journal d’audit</h1>
          <p className="card-sub">Connexions, comptes et changements d’organisation.</p>
        </div>
      </div>

      <article className="dash-card">
        {logs.length === 0 ? (
          <p className="empty-copy">Aucune activité enregistrée pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Acteur</th>
                  <th>Action</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.createdAt.toLocaleString("fr-CD", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td>{item.actor?.name ?? "—"}</td>
                    <td>{item.action}</td>
                    <td>{item.summary}</td>
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
