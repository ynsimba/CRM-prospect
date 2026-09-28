import Shell from "@/components/Shell";
import UserCreateModal from "@/components/UserCreateModal";
import UserDeleteButton from "@/components/UserDeleteButton";
import { toggleUserAction } from "@/app/actions/users";
import { requirePermission } from "@/lib/auth";
import { Role } from "@/lib/enums";
import { PERMISSIONS } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { listUsers } from "@/lib/users";

function formatLastLogin(value: Date | null) {
  if (!value) return "Jamais";
  return value.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" });
}

export default async function UsersPage() {
  const session = await requirePermission(PERMISSIONS.usersManage);
  const users = (await listUsers(session)).filter((user) => user.role !== "SUPER_ADMIN");

  return (
    <Shell activeHref="/utilisateurs">
      <div className="page-head">
        <div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="card-sub">
            Comptes Admin, Direction et Délégué commercial · {users.length} utilisateur
            {users.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="page-head-actions">
          <UserCreateModal />
        </div>
      </div>

      <div className="row g-3 users-layout">
        <div className="col-12">
          <article className="dash-card">
            {users.length === 0 ? (
              <p className="empty-copy">Aucun utilisateur pour le moment.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Rôle</th>
                      <th>Équipe</th>
                      <th>Dernière connexion</th>
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
                          {user.phone ? <div className="muted-line">{user.phone}</div> : null}
                        </td>
                        <td>{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}</td>
                        <td>{user.team?.name ?? "—"}</td>
                        <td>{formatLastLogin(user.lastLoginAt)}</td>
                        <td>
                          <span className={`status-pill ${user.isActive ? "on" : "off"}`}>
                            {user.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td>
                          {user.id !== session.userId ? (
                            <div className="user-row-actions">
                              <form action={toggleUserAction.bind(null, user.id)}>
                                <button type="submit" className="table-action">
                                  {user.isActive ? "Désactiver" : "Activer"}
                                </button>
                              </form>
                              {session.role === Role.SUPER_ADMIN ? (
                                <UserDeleteButton userId={user.id} userName={user.name} />
                              ) : null}
                            </div>
                          ) : (
                            <span className="muted-line">Vous</span>
                          )}
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
