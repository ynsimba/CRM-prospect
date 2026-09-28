import Link from "next/link";
import Shell from "@/components/Shell";
import ContactForm from "@/components/ContactForm";
import { requirePermission } from "@/lib/auth";
import { listContacts } from "@/lib/contacts";
import { personCategoryLabel, whatsappHref } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";

export default async function ReferrersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.companiesManage);
  const { q } = await searchParams;
  const [contacts, options] = await Promise.all([
    listContacts(session, q, "porteur"),
    getCrmOptions(session),
  ]);

  return (
    <Shell activeHref="/apporteurs">
      <div className="page-head">
        <div>
          <h1 className="page-title">Apporteurs d’affaires</h1>
          <p className="card-sub">Porteurs de projet séparés des personnes de contact.</p>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <form method="get" className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="login-field">
              Recherche
              <input name="q" defaultValue={q ?? ""} placeholder="Nom, e-mail, entreprise" />
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
            {contacts.length === 0 ? (
              <p className="empty-copy">Aucun porteur de projet pour le moment.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Titre</th>
                      <th>Prénom</th>
                      <th>Nom</th>
                      <th>Fonction</th>
                      <th>Catégorie</th>
                      <th>Entreprise</th>
                      <th>Tél</th>
                      <th>Mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => {
                      const wa = contact.whatsapp ? whatsappHref(contact.whatsapp) : null;
                      return (
                        <tr key={contact.id}>
                          <td>{contact.displayCode ?? "—"}</td>
                          <td>{contact.civility ?? "—"}</td>
                          <td>
                            <Link href={`/contacts/${contact.id}`}>{contact.firstName}</Link>
                          </td>
                          <td>{contact.lastName}</td>
                          <td>{contact.jobTitle ?? "—"}</td>
                          <td>{personCategoryLabel(contact.category)}</td>
                          <td>
                            {contact.company ? (
                              <Link href={`/entreprises/${contact.company.id}`}>{contact.company.name}</Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {contact.phone ?? "—"}
                            {wa ? (
                              <>
                                {" · "}
                                <a href={wa} target="_blank" rel="noreferrer">
                                  WhatsApp
                                </a>
                              </>
                            ) : null}
                          </td>
                          <td>{contact.email ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
        {canManage ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Nouveau porteur</h3>
              <ContactForm companies={options.companies} defaultCategory="porteur" />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
