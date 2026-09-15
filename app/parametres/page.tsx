import Link from "next/link";
import Shell from "@/components/Shell";
import OrganizationForm from "@/components/OrganizationForm";
import { SourceAddForm, StatusAddForm, TagAddForm } from "@/components/CatalogForms";
import { requireSession } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getOrganizationSettings } from "@/lib/settings";

export default async function SettingsPage() {
  const session = await requireSession();
  const canSettings =
    session.role !== "SUPER_ADMIN" && roleHasPermission(session.role, PERMISSIONS.settingsManage);
  const canUsers = roleHasPermission(session.role, PERMISSIONS.usersManage);
  const [organization, options] = await Promise.all([
    getOrganizationSettings(session),
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
            <h3>Utilisateurs</h3>
            {canUsers ? (
              <p className="empty-copy">
                Les comptes se gèrent dans le module{" "}
                <Link href="/utilisateurs">Utilisateurs</Link> (Admin, Direction, Délégué commercial).
              </p>
            ) : (
              <p className="empty-copy">Seul l’Admin gère les comptes (Admin, Direction, Délégué commercial).</p>
            )}
          </article>
        </div>
      </div>

      {canSettings ? (
        <div className="row g-3" style={{ marginTop: 4 }}>
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Statuts</h3>
              <p className="muted-line">Opportunité, Lead, Pipeline, Rejeté, Finalisé</p>
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
