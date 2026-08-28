import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ContactForm from "@/components/ContactForm";
import { requirePermission } from "@/lib/auth";
import { getCompany } from "@/lib/companies";
import { fullName, statusPillClass } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const { id } = await params;
  const [company, options] = await Promise.all([getCompany(session, id), getCrmOptions(session)]);
  if (!company) {
    notFound();
  }

  const canManage = roleHasPermission(session.role, PERMISSIONS.companiesManage);

  return (
    <Shell activeHref="/entreprises">
      <div className="page-head">
        <div>
          <h1 className="page-title">{company.name}</h1>
          <p className="card-sub">
            {[company.industry, company.city, company.size].filter(Boolean).join(" · ") || "Entreprise"}
          </p>
        </div>
        <Link href="/entreprises" className="table-action">
          Retour à la liste
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <article className="dash-card" style={{ marginBottom: 16 }}>
            <h3>Fiche</h3>
            <div className="table-wrap">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td>Commercial</td>
                    <td>{company.owner?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>E-mail</td>
                    <td>{company.email ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Téléphone</td>
                    <td>{company.phone ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Site</td>
                    <td>{company.website ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Adresse</td>
                    <td>{company.address ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Notes</td>
                    <td>{company.notes ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dash-card" style={{ marginBottom: 16 }}>
            <h3>Contacts</h3>
            {company.contacts.length === 0 ? (
              <p className="empty-copy">Aucun contact rattaché.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Fonction</th>
                      <th>E-mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.contacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>
                          <Link href={`/contacts/${contact.id}`}>
                            {fullName(contact.firstName, contact.lastName)}
                          </Link>
                        </td>
                        <td>{contact.jobTitle ?? "—"}</td>
                        <td>{contact.email ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="dash-card">
            <h3>Prospects</h3>
            {company.prospects.length === 0 ? (
              <p className="empty-copy">Aucun prospect rattaché.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Statut</th>
                      <th>Commercial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {company.prospects.map((prospect) => (
                      <tr key={prospect.id}>
                        <td>
                          <Link href={`/prospects/${prospect.id}`}>
                            {fullName(prospect.firstName, prospect.lastName)}
                          </Link>
                        </td>
                        <td>
                          <span className={`status-pill ${statusPillClass(prospect.status.slug, prospect.status.isConverted, prospect.status.isLost)}`}>
                            {prospect.status.name}
                          </span>
                        </td>
                        <td>{prospect.owner?.name ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>

        {canManage ? (
          <div className="col-12 col-xl-5">
            <article className="dash-card">
              <h3>Ajouter un contact</h3>
              <ContactForm companies={options.companies} defaultCompanyId={company.id} />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
