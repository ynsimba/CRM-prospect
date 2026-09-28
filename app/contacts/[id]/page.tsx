import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import { requirePermission } from "@/lib/auth";
import { getContact } from "@/lib/contacts";
import { fullName, personCategoryLabel, statusPillClass, whatsappHref } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import type { Row } from "@/lib/prisma";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const { id } = await params;
  const contact = await getContact(session, id);
  if (!contact) {
    notFound();
  }

  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp) : null;

  return (
    <Shell activeHref="/contacts">
      <div className="page-head">
        <div>
          <h1 className="page-title">{fullName(contact.firstName, contact.lastName)}</h1>
          <p className="card-sub">{contact.jobTitle ?? "Contact"}</p>
        </div>
        <Link href="/contacts" className="table-action">
          Retour à la liste
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <article className="dash-card">
            <h3>Fiche</h3>
            <div className="table-wrap">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td>ID</td>
                    <td>{contact.displayCode ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Titre</td>
                    <td>{contact.civility ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Entreprise</td>
                    <td>
                      {contact.company ? (
                        <Link href={`/entreprises/${contact.company.id}`}>{contact.company.name}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Fonction</td>
                    <td>{contact.jobTitle ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Catégorie</td>
                    <td>{personCategoryLabel(contact.category)}</td>
                  </tr>
                  <tr>
                    <td>Commercial</td>
                    <td>{contact.owner?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>E-mail</td>
                    <td>{contact.email ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Téléphone</td>
                    <td>{contact.phone ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>WhatsApp</td>
                    <td>
                      {wa ? (
                        <a href={wa} target="_blank" rel="noreferrer">
                          {contact.whatsapp}
                        </a>
                      ) : (
                        (contact.whatsapp ?? "—")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>LinkedIn</td>
                    <td>{contact.linkedin ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Notes</td>
                    <td>{contact.notes ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>
        <div className="col-12 col-xl-5">
          <article className="dash-card">
            <h3>Prospects liés</h3>
            {contact.prospects.length === 0 ? (
              <p className="empty-copy">Aucun prospect lié à ce contact.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contact.prospects.map((prospect: Row) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </div>
    </Shell>
  );
}
