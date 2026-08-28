import Link from "next/link";
import Shell from "@/components/Shell";
import CompanyForm from "@/components/CompanyForm";
import { requirePermission } from "@/lib/auth";
import { listCompanies } from "@/lib/companies";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.companiesManage);
  const { q } = await searchParams;
  const [companies, options] = await Promise.all([
    listCompanies(session, q),
    getCrmOptions(session),
  ]);

  return (
    <Shell activeHref="/entreprises">
      <div className="page-head">
        <div>
          <h1 className="page-title">Entreprises</h1>
          <p className="card-sub">Comptes B2B, contacts et prospects rattachés.</p>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <form method="get" className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="login-field">
              Recherche
              <input name="q" defaultValue={q ?? ""} placeholder="Nom, ville, secteur, e-mail" />
            </label>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn-download">
              Filtrer
            </button>
          </div>
        </form>
      </article>

      <div className="row g-3">
        <div className={canManage ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card">
            {companies.length === 0 ? (
              <p className="empty-copy">Aucune entreprise pour le moment.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Entreprise</th>
                      <th>Ville</th>
                      <th>Secteur</th>
                      <th>Commercial</th>
                      <th>Contacts</th>
                      <th>Prospects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <Link href={`/entreprises/${company.id}`}>
                            <strong>{company.name}</strong>
                          </Link>
                          <div className="muted-line">{company.email ?? company.phone ?? "—"}</div>
                        </td>
                        <td>{company.city ?? "—"}</td>
                        <td>{company.industry ?? "—"}</td>
                        <td>{company.owner?.name ?? "—"}</td>
                        <td>{company._count.contacts}</td>
                        <td>{company._count.prospects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
        {canManage ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Nouvelle entreprise</h3>
              <CompanyForm owners={options.owners} />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
