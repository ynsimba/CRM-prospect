import Link from "next/link";
import Shell from "@/components/Shell";
import ContactForm from "@/components/ContactForm";
import { requirePermission } from "@/lib/auth";
import { listContacts } from "@/lib/contacts";
import { personCategoryLabel, whatsappHref } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { isSalesRole } from "@/lib/roles";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const isSales = isSalesRole(session.role);
  const canManage = roleHasPermission(session.role, PERMISSIONS.companiesManage);
  const showCreateForm = canManage && !isSales;
  const { q } = await searchParams;
  const [contacts, options] = await Promise.all([
    listContacts(session, q),
    getCrmOptions(session),
  ]);

  return (
    <Shell activeHref="/contacts">
      <div className="page-head">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="card-sub">Interlocuteurs rattachés aux entreprises.</p>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <form method="get" className="row g-2 align-items-end">
          <div className="col-md-6">
            <label className="login-field">
              Recherche
              <input name="q" defaultValue={q ?? ""} placeholder="Nom, e-mail, téléphone, société" />
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
        <div className={showCreateForm ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card">
            {contacts.length === 0 ? (
              <p className="empty-copy">Aucun contact pour le moment.</p>
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
                      <th>Commercial</th>
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
                          <td>{contact.owner?.name ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
        {showCreateForm ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Nouveau contact</h3>
              <ContactForm companies={options.companies} />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
