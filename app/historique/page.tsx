import Link from "next/link";
import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { listStatusHistory } from "@/lib/status-history";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const { q } = await searchParams;
  const rows = await listStatusHistory(session, q);

  return (
    <Shell activeHref="/historique">
      <div className="page-head">
        <div>
          <h1 className="page-title">Historique des statuts</h1>
          <p className="card-sub">Journal automatique à chaque changement de statut ou de commentaire.</p>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <form method="get" className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="login-field">
              Recherche
              <input name="q" defaultValue={q ?? ""} placeholder="Entreprise, statut, commentaire" />
            </label>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn-download">
              Filtrer
            </button>
          </div>
        </form>
      </article>

      <article className="dash-card">
        {rows.length === 0 ? (
          <p className="empty-copy">Aucun changement enregistré.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Résumé</th>
                  <th>Entreprise</th>
                  <th>Date</th>
                  <th>Nouveau statut</th>
                  <th>Commentaire</th>
                  <th>Commercial</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.displayCode ?? "—"}</td>
                    <td>
                      <Link href={`/prospects/${row.prospect.id}`}>
                        <strong>{row.summary}</strong>
                      </Link>
                    </td>
                    <td>{row.companyName}</td>
                    <td>
                      {row.occurredAt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>{row.statusName}</td>
                    <td>{row.comment ?? "—"}</td>
                    <td>{row.actor?.name ?? "—"}</td>
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
