import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { listSaaSOrganizations } from "@/lib/admin";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AdminPage() {
  const session = await requirePermission(PERMISSIONS.saasAdmin);
  const organizations = await listSaaSOrganizations(session);

  return (
    <Shell activeHref="/admin">
      <div className="page-head">
        <div>
          <h1 className="page-title">Administration SaaS</h1>
          <p className="card-sub">Organisations, utilisateurs et volume de prospects.</p>
        </div>
      </div>

      <article className="dash-card">
        {organizations.length === 0 ? (
          <p className="empty-copy">Aucune organisation.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organisation</th>
                  <th>Comptes</th>
                  <th>Prospects</th>
                  <th>Entreprises</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <strong>{org.name}</strong>
                      <div className="muted-line">
                        {org.slug} · {org.currency}
                      </div>
                    </td>
                    <td>{org._count.users}</td>
                    <td>{org._count.prospects}</td>
                    <td>{org._count.companies}</td>
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
