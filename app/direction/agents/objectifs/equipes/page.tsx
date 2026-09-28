import AgentsModule from "@/components/agents/AgentsModule";
import GoalForm from "@/components/agents/GoalForm";
import MonthPicker, { monthLabel, parseMonth } from "@/components/agents/MonthPicker";
import { GOAL_METRICS, emptyTargets } from "@/lib/agent-cockpit-logic";
import { goalsForMonth, listTeamsWithMembers, requireAgentScope } from "@/lib/agents";

export default async function TeamGoalsPage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const scope = await requireAgentScope();
  const { year, month } = parseMonth((await searchParams).mois);
  const [teams, goals] = await Promise.all([listTeamsWithMembers(scope), goalsForMonth(scope, year, month)]);
  const visible = scope.isTeamLead ? teams.filter((team) => team.id === scope.teamId) : teams;
  return (
    <AgentsModule
      scope={scope}
      active="objectifs-equipe"
      title={`Objectifs équipe — ${monthLabel(year, month)}`}
      subtitle="Objectifs collectifs par équipe commerciale ; le réalisé additionne les résultats des membres."
      actions={<MonthPicker year={year} month={month} />}
    >
      <article className="dash-card">
        {visible.length === 0 ? (
          <p className="empty-copy">Aucune équipe. Crée-les dans Configuration → Équipes commerciales.</p>
        ) : (
          <div className="goal-table">
            <div className="goal-table-head">
              <span>Équipe</span>
              {GOAL_METRICS.map((metric) => (
                <span key={metric.key}>
                  {metric.label}
                </span>
              ))}
              <span className="visually-hidden">Action</span>
            </div>
            {visible.map((team) => (
              <div key={team.id} className="goal-table-row">
                <span className="agent-cell">
                  <span>
                    <span className="agent-name">{team.name}</span>
                    <span className="muted-line">
                      {team.members.length} membre{team.members.length > 1 ? "s" : ""}
                    </span>
                  </span>
                </span>
                <GoalForm
                  owner={{ teamId: team.id }}
                  year={year}
                  month={month}
                  targets={goals.byTeam.get(team.id) ?? emptyTargets()}
                  compact
                  label={team.name}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </AgentsModule>
  );
}
