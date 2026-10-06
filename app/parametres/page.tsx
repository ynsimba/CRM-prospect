import Link from "next/link";
import Shell from "@/components/Shell";
import OrganizationForm from "@/components/OrganizationForm";
import PasswordForm from "@/components/PasswordForm";
import { SourceAddForm, StatusAddForm, TagAddForm } from "@/components/CatalogForms";
import { requireSession } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { accountRoleLabel } from "@/lib/roles";
import { getOrganizationSettings } from "@/lib/settings";
import { welcomeDisplayName } from "@/lib/welcome";

export default async function SettingsPage() {
  const session = await requireSession();
  const canSettings =
    roleHasPermission(session.role, PERMISSIONS.settingsManage);
  const canUsers = roleHasPermission(session.role, PERMISSIONS.usersManage);
  const [account, organization, options] = await Promise.all([
    prisma.user.findFirst({
      where: { id: session.userId, organizationId: session.organizationId },
      select: { name: true, email: true, civility: true },
    }),
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
          <p className="card-sub">Mon compte, organisation et journal d’activité.</p>
        </div>
        {canSettings ? (
          <Link href="/journal" className="table-action">
            Journal d’audit
          </Link>
        ) : null}
      </div>

      <div className="row g-3" style={{ marginBottom: 16 }}>
        <div className="col-12 col-xl-5">
          <article className="dash-card">
            <h3>Mon compte</h3>
            <dl className="account-facts">
              <div>
                <dt>Nom</dt>
                <dd>{welcomeDisplayName(account?.name ?? session.name, account?.civility)}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{account?.email ?? "—"}</dd>
              </div>
              <div>
                <dt>Rôle</dt>
                <dd>{accountRoleLabel(session.role, account?.civility)}</dd>
              </div>
            </dl>
          </article>
        </div>
        <div className="col-12 col-xl-7">
          <article className="dash-card" id="mot-de-passe">
            <h3>Mot de passe</h3>
            <p className="muted-line">Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p>
            <PasswordForm />
          </article>
        </div>
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
                {organization ? organization.name : "Aucune organisation."}
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
