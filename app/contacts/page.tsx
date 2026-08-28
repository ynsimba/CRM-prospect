import Link from "next/link";
import Shell from "@/components/Shell";
import ContactForm from "@/components/ContactForm";
import { requirePermission } from "@/lib/auth";
import { listContacts } from "@/lib/contacts";
import { fullName, whatsappHref } from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.companiesRead);
  const isSales = session.role === "SALES";
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
                      <th>Contact</th>
                      <th>Entreprise</th>
                      <th>Téléphone</th>
                      <th>WhatsApp</th>
                      <th>Commercial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => {
                      const wa = contact.whatsapp ? whatsappHref(contact.whatsapp) : null;
                      return (
                        <tr key={contact.id}>
                          <td>
                            <Link href={`/contacts/${contact.id}`}>
                              <strong>{fullName(contact.firstName, contact.lastName)}</strong>
                            </Link>
                            <div className="muted-line">{contact.jobTitle ?? contact.email ?? "—"}</div>
                          </td>
                          <td>
                            {contact.company ? (
                              <Link href={`/entreprises/${contact.company.id}`}>{contact.company.name}</Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{contact.phone ?? "—"}</td>
                          <td>
                            {wa ? (
                              <a href={wa} target="_blank" rel="noreferrer">
                                WhatsApp
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
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
