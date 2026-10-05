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
      <div className="query-container">
        <nav className="query-crumb" aria-label="Fil d’Ariane">
          <span>Interface Commerciale</span>
          <i className="bi bi-chevron-right" aria-hidden />
          <strong>Tous les contacts</strong>
        </nav>
        <h1 className="query-heading">Tous les contacts</h1>
        <p className="query-desc">
          {isSales
            ? "Interlocuteurs rattachés à vos entreprises en prospection"
            : "Interlocuteurs rattachés aux entreprises"}
        </p>

        <div className="query-toolbar">
          <div className="query-tabs" role="tablist" aria-label="Périmètre des contacts">
            <span className="query-tab active" role="tab" aria-selected="true">
              Tous les contacts
            </span>
          </div>
          <div className="query-actions">
            <form method="get" className="query-search is-open">
              <button type="submit" className="query-icon-btn" aria-label="Rechercher">
                <i className="bi bi-search" aria-hidden />
              </button>
              <input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Rechercher contacts"
                aria-label="Rechercher contacts"
              />
            </form>
            {canManage ? (
              <Link href="/contacts/nouveau" className="query-icon-btn" aria-label="Ajouter un contact">
                <i className="bi bi-person-plus" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="row g-3" style={{ marginTop: 16 }}>
        <div className={showCreateForm ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card query-grid">
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
