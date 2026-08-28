import Link from "next/link";
import Shell from "@/components/Shell";
import OrganizationForm from "@/components/OrganizationForm";
import UserForm from "@/components/UserForm";
import { SourceAddForm, StatusAddForm, TagAddForm } from "@/components/CatalogForms";
import { toggleUserAction } from "@/app/actions/users";
import { requireSession } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getOrganizationSettings } from "@/lib/settings";
import { listUsers } from "@/lib/users";

export default async function SettingsPage() {
  const session = await requireSession();
  const canSettings =
    session.role !== "SUPER_ADMIN" && roleHasPermission(session.role, PERMISSIONS.settingsManage);
  const canUsers = roleHasPermission(session.role, PERMISSIONS.usersManage);
  const [organization, users, options] = await Promise.all([
    getOrganizationSettings(session),
    canUsers ? listUsers(session) : Promise.resolve([]),
    canSettings
      ? getCrmOptions(session)
      : Promise.resolve({ statuses: [], sources: [], tags: [], companies: [], owners: [] }),
  ]);

  return (
    <Shell activeHref="/parametres">
      <div className="page-head">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="card-sub">Organisation, équipe et journal d’activité.</p>
        </div>
        {canSettings ? (
          <Link href="/journal" className="table-action">
            Journal d’audit
          </Link>
        ) : null}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <article className="dash-card">
            <h3>Organisation</h3>
            {organization && canSettings ? (
              <OrganizationForm
                name={organization.name}
                phone={organization.phone ?? ""}
                website={organization.website ?? ""}
                currency={organization.currency}
                timezone={organization.timezone}
              />
            ) : (
              <p className="empty-copy">
                {organization ? `${organization.name} · ${organization.currency}` : "Aucune organisation."}
              </p>
            )}
          </article>
        </div>

        <div className="col-12 col-xl-7">
          <article className="dash-card">
            <h3>Équipe</h3>
            {canUsers ? (
              <>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                            <div className="muted-line">{user.email}</div>
                          </td>
                          <td>{ROLE_LABELS[user.role]}</td>
                          <td>
                            <span className={`status-pill ${user.isActive ? "on" : "off"}`}>
                              {user.isActive ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td>
                            {user.id !== session.userId && user.role !== "SUPER_ADMIN" ? (
                              <form action={toggleUserAction.bind(null, user.id)}>
                                <button type="submit" className="table-action">
                                  {user.isActive ? "Désactiver" : "Activer"}
                                </button>
                              </form>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: 16 }}>
                  <h3>Nouvel utilisateur</h3>
                  <UserForm />
                </div>
              </>
            ) : (
              <p className="empty-copy">L’admin et le manager gèrent les comptes.</p>
            )}
          </article>
        </div>
      </div>

      {canSettings ? (
        <div className="row g-3" style={{ marginTop: 4 }}>
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Statuts</h3>
              <p className="muted-line">Nouveau, contacté, converti…</p>
              <ul className="catalog-list">
                {options.statuses.map((status) => (
                  <li key={status.id}>{status.name}</li>
                ))}
              </ul>
              <StatusAddForm />
            </article>
          </div>
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Sources</h3>
              <p className="muted-line">D’où viennent les leads.</p>
              <ul className="catalog-list">
                {options.sources.map((source) => (
                  <li key={source.id}>{source.name}</li>
                ))}
              </ul>
              <SourceAddForm />
            </article>
          </div>
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Tags</h3>
              <p className="muted-line">VIP, Hot Lead, À relancer…</p>
              <ul className="catalog-list">
                {options.tags.map((tag) => (
                  <li key={tag.id}>{tag.name}</li>
                ))}
              </ul>
              <TagAddForm />
            </article>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
