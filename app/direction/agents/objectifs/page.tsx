import Link from "next/link";
import AgentsModule from "@/components/agents/AgentsModule";
import GoalForm from "@/components/agents/GoalForm";
import MonthPicker, { monthLabel, parseMonth } from "@/components/agents/MonthPicker";
import { AgentAvatar } from "@/components/agents/ui";
import { GOAL_METRICS, emptyTargets } from "@/lib/agent-cockpit-logic";
import { goalsForMonth, loadAgents, requireAgentScope } from "@/lib/agents";

export default async function IndividualGoalsPage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const scope = await requireAgentScope();
  const { year, month } = parseMonth((await searchParams).mois);
  const [agents, goals] = await Promise.all([loadAgents(scope), goalsForMonth(scope, year, month)]);
  const active = agents.filter((agent) => agent.status === "ACTIVE");
  return (
    <AgentsModule
      scope={scope}
      active="objectifs"
      title={`Objectifs individuels — ${monthLabel(year, month)}`}
      subtitle="Prospects à traiter, appels, RDV, propositions et conversions, par agent."
      actions={<MonthPicker year={year} month={month} />}
    >
      <article className="dash-card">
        {active.length === 0 ? (
          <p className="empty-copy">Aucun agent actif.</p>
        ) : (
          <div className="goal-table">
            <div className="goal-table-head">
              <span>Agent</span>
              {GOAL_METRICS.map((metric) => (
                <span key={metric.key}>
                  {metric.label}
                </span>
              ))}
              <span className="visually-hidden">Action</span>
            </div>
            {active.map((agent) => (
              <div key={agent.id} className="goal-table-row">
                <Link href={`/direction/agents/${agent.id}?onglet=objectifs`} className="agent-cell">
                  <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} size={28} />
                  <span className="agent-name">{agent.name}</span>
                </Link>
                <GoalForm
                  owner={{ userId: agent.id }}
                  year={year}
                  month={month}
                  targets={goals.byUser.get(agent.id) ?? emptyTargets()}
                  compact
                  label={agent.name}
                />
              </div>
            ))}
          </div>
        )}
      </article>
    </AgentsModule>
  );
}
