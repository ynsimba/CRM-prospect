import Link from "next/link";
import AgentsModule from "@/components/agents/AgentsModule";
import { monthLabel } from "@/components/agents/MonthPicker";
import { ProgressBar, pct } from "@/components/agents/ui";
import { GOAL_METRICS } from "@/lib/agent-cockpit-logic";
import { goalTracking, requireAgentScope } from "@/lib/agents";
import { formatFc } from "@/lib/money";

type Metric = { key: string; label: string; achieved: number; target: number; pct: number | null };

function Cell({ metric }: { metric: Metric }) {
  const fmt = (value: number) => (metric.key === "revenue" ? formatFc(value) : value);
  return (
    <td className="goal-cell">
      <span className="goal-cell-figures">
        {fmt(metric.achieved)} / {metric.target ? fmt(metric.target) : "—"}
      </span>
      {metric.target ? (
        <>
          <ProgressBar pct={metric.pct} label={`${metric.label} : ${metric.pct ?? 0} %`} />
          <span className="muted-line">{pct(metric.pct)}</span>
        </>
      ) : null}
    </td>
  );
}

export default async function GoalTrackingPage() {
  const scope = await requireAgentScope();
  const { year, month, agentRows, teamRows } = await goalTracking(scope);
  return (
    <AgentsModule
      scope={scope}
      active="realisations"
      title={`Suivi des réalisations — ${monthLabel(year, month)}`}
      subtitle="Objectif / Réalisé / Progression, calculés automatiquement à partir de l’activité enregistrée."
    >
      <article className="dash-card cockpit-section">
        <h3>Par agent</h3>
        <div className="table-wrap">
          <table className="data-table goal-matrix">
            <thead>
              <tr>
                <th scope="col">Agent</th>
                {GOAL_METRICS.map((metric) => (
                  <th key={metric.key} scope="col">
                    {metric.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agentRows.map((row) => (
                <tr key={row.agent.id}>
                  <th scope="row">
                    <Link href={`/direction/agents/${row.agent.id}?onglet=objectifs`} className="agent-name">
                      {row.agent.name}
                    </Link>
                  </th>
                  {row.metrics.map((metric) => (
                    <Cell key={metric.key} metric={metric} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <article className="dash-card">
        <h3>Par équipe</h3>
        {teamRows.length === 0 ? (
          <p className="empty-copy">Aucun agent rattaché à une équipe.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table goal-matrix">
              <thead>
                <tr>
                  <th scope="col">Équipe</th>
                  {GOAL_METRICS.map((metric) => (
                    <th key={metric.key} scope="col">
                      {metric.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamRows.map((row) => (
                  <tr key={row.teamId}>
                    <th scope="row">{row.teamName}</th>
                    {row.metrics.map((metric) => (
                      <Cell key={metric.key} metric={metric} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </AgentsModule>
  );
}
