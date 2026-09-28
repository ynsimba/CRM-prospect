import { ProgressBar, pct } from "@/components/agents/ui";
import type { GoalMetricKey } from "@/lib/agent-cockpit-logic";
import type { Performance } from "@/lib/agents";
import { formatFc } from "@/lib/money";

type GoalRow = { key: GoalMetricKey; label: string; achieved: number; target: number; pct: number | null };

function Line({ label, value, goal }: { label: string; value: string | number; goal?: GoalRow }) {
  return (
    <li className="perf-line">
      <span className="perf-label">{label}</span>
      <span className="perf-value">{value}</span>
      {goal && goal.target ? (
        <span className="perf-goal">
          <ProgressBar pct={goal.pct} label={`${label} : ${goal.pct ?? 0} % de l’objectif`} />
          <span className="muted-line">
            obj. {goal.key === "revenue" ? formatFc(goal.target) : goal.target} · {pct(goal.pct)}
          </span>
        </span>
      ) : null}
    </li>
  );
}

/** Descriptive indicators (§11), compared with the agent's goal when one exists. */
export default function PerformancePanel({ perf, goals }: { perf: Performance; goals?: GoalRow[] }) {
  const goal = (key: GoalMetricKey) => goals?.find((item) => item.key === key);
  return (
    <div className="row g-3">
      <div className="col-12 col-lg-4">
        <article className="dash-card h-100">
          <h3>Activité</h3>
          <ul className="perf-list">
            <Line label="Prospects reçus" value={perf.activity.received} />
            <Line label="Prospects contactés" value={perf.activity.contacted} goal={goal("prospects")} />
            <Line label="Appels" value={perf.activity.calls} goal={goal("calls")} />
            <Line label="E-mails" value={perf.activity.emails} />
            <Line label="RDV" value={perf.activity.meetings} goal={goal("meetings")} />
            <Line label="Relances" value={perf.activity.followUps} />
            <Line label="Propositions" value={perf.activity.proposals} goal={goal("proposals")} />
          </ul>
        </article>
      </div>
      <div className="col-12 col-lg-4">
        <article className="dash-card h-100">
          <h3>Résultats</h3>
          <ul className="perf-list">
            <Line label="Prospects qualifiés" value={perf.results.qualified} />
            <Line label="Opportunités créées" value={perf.results.opportunities} />
            <Line label="Ventes / conversions" value={perf.results.conversions} goal={goal("conversions")} />
            <Line label="CA généré" value={formatFc(perf.results.revenue)} goal={goal("revenue")} />
            <Line label="Valeur du pipeline" value={formatFc(perf.results.pipelineValue)} />
          </ul>
        </article>
      </div>
      <div className="col-12 col-lg-4">
        <article className="dash-card h-100">
          <h3>Ratios</h3>
          <ul className="perf-list">
            <Line label="Taux de prise en charge" value={pct(perf.ratios.handling)} />
            <Line label="Taux de qualification" value={pct(perf.ratios.qualification)} />
            <Line label="Taux RDV" value={pct(perf.ratios.meeting)} />
            <Line label="Taux de conversion" value={pct(perf.ratios.conversion)} />
            <Line
              label="Délai moyen de premier contact"
              value={perf.ratios.firstContactDays === null ? "—" : `${perf.ratios.firstContactDays} j`}
            />
            <Line label="Durée moyenne du cycle" value={perf.ratios.cycleDays === null ? "—" : `${perf.ratios.cycleDays} j`} />
          </ul>
        </article>
      </div>
    </div>
  );
}
