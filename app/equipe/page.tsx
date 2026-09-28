import Link from "next/link";
import Shell from "@/components/Shell";
import { GoalForm, TeamAssignForm, TeamCreateForm } from "@/components/TeamForms";
import { parseYearMonth } from "@/lib/activity-logic";
import { requirePermission } from "@/lib/auth";
import { goalProgress } from "@/lib/goal-logic";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { getTeamPerformance, listTeams } from "@/lib/team";

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.teamRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.usersManage);
  const { month: monthParam } = await searchParams;
  const { year, monthIndex } = parseYearMonth(monthParam);
  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;

  const [board, teams] = await Promise.all([
    getTeamPerformance(session, year, monthIndex),
    listTeams(session),
  ]);
  const openOpportunities = board.reps.reduce((sum, rep) => sum + rep.opportunities, 0);

  return (
    <Shell activeHref="/equipe">
      <div className="page-head">
        <div>
          <h1 className="page-title">Équipe</h1>
          <p className="card-sub">
            {MONTH_LABELS[monthIndex]} {year} · {board.reps.length} commerciaux
          </p>
        </div>
        <div>
          <Link href={`/equipe?month=${prevKey}`} className="table-action">
            Mois précédent
          </Link>
          {" · "}
          <Link href={`/equipe?month=${nextKey}`} className="table-action">
            Mois suivant
          </Link>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr>
                <td>Prospects créés</td>
                <td>{board.totals.prospects}</td>
              </tr>
              <tr>
                <td>Rendez-vous / visites / démos</td>
                <td>{board.totals.meetings}</td>
              </tr>
              <tr>
                <td>Opportunités</td>
                <td>{openOpportunities}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <div className="row g-3">
        <div className={canManage ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card">
            <h3>Classement</h3>
            {board.reps.length === 0 ? (
              <p className="empty-copy">Aucun commercial actif.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Commercial</th>
                      <th>Prospects</th>
                      <th>RDV</th>
                      <th>Affaires</th>
                      <th>Objectif opportunités</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.reps.map((rep, index) => {
                      const progress = goalProgress(rep.opportunities, rep.goal?.opportunitiesTarget ?? 0);
                      return (
                        <tr key={rep.id}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{rep.name}</strong>
                            <div className="muted-line">
                              {ROLE_LABELS[rep.role as keyof typeof ROLE_LABELS]}
                              {rep.teamName ? ` · ${rep.teamName}` : ""}
                            </div>
                          </td>
                          <td>
                            {rep.prospects}
                            {rep.goal ? ` / ${rep.goal.prospectsTarget}` : ""}
                          </td>
                          <td>
                            {rep.meetings}
                            {rep.goal ? ` / ${rep.goal.meetingsTarget}` : ""}
                          </td>
                          <td>
                            {rep.opportunities}
                            {rep.goal ? ` / ${rep.goal.opportunitiesTarget}` : ""}
                          </td>
                          <td>
                            {rep.goal?.opportunitiesTarget ? (
                              <>
                                {rep.opportunities} / {rep.goal.opportunitiesTarget}
                                <div className={`goal-bar${progress >= 80 ? " is-hot" : ""}`} style={{ marginTop: 6 }}>
                                  <span style={{ width: `${progress}%` }} />
                                </div>
                                <div className="muted-line">{progress}%</div>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted-line" style={{ marginTop: 12 }}>
              Les comptes se créent dans <Link href="/utilisateurs">Utilisateurs</Link>.
            </p>
          </article>
        </div>

        {canManage ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Objectif {MONTH_LABELS[monthIndex]}</h3>
              <GoalForm
                users={board.reps.map((rep) => ({ id: rep.id, name: rep.name }))}
                year={year}
                month={monthIndex + 1}
              />
            </article>
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Nouvelle équipe</h3>
              <TeamCreateForm />
            </article>
            <article className="dash-card">
              <h3>Affecter</h3>
              <TeamAssignForm
                users={board.reps.map((rep) => ({ id: rep.id, name: rep.name }))}
                teams={teams}
              />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
