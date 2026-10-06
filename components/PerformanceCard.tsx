import CountUp from "./CountUp";
import type { AgentPerformanceBreakdown } from "@/lib/dashboard-logic";

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function PerformanceCard({ agentPerformance }: { agentPerformance: AgentPerformanceBreakdown }) {
  const performance = clampPercent(agentPerformance.percent);
  const { byStage } = agentPerformance;
  const tone = performance >= 70 ? "is-strong" : performance >= 40 ? "is-mid" : "is-low";

  return (
    <article className={`dash-card welcome-perf ${tone}`} role="group" aria-label="Performance individuelle">
      <div className="welcome-perf-top">
        <div>
          <h3>Performance</h3>
          <p className="card-sub">Création 5% · Lead 15% · Pipeline 30% · Finalisé 50%</p>
        </div>
        <p className="welcome-perf-score" aria-label={`Score ${performance} pour cent`}>
          <CountUp end={performance} duration={1200} suffix="%" />
        </p>
      </div>

      <div
        className="welcome-perf-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={performance}
        aria-label="Barre de performance individuelle"
      >
        <span className="welcome-perf-fill" style={{ width: `${performance}%` }} />
      </div>

      <div className="welcome-perf-meta">
        <span>
          Opp. <strong>{byStage.opportunite}</strong>
        </span>
        <span>
          Lead <strong>{byStage.lead}</strong>
        </span>
        <span>
          Pipeline <strong>{byStage.pipeline}</strong>
        </span>
        <span>
          Finalisé <strong>{byStage.finalise}</strong>
        </span>
      </div>
    </article>
  );
}
