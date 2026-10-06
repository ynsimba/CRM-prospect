import CountUp from "./CountUp";
import type { AgentPerformanceBreakdown } from "@/lib/dashboard-logic";
import type { CouleurScore } from "@/lib/performance";

const SCORE_TONES: Record<CouleurScore, string> = {
  vert: "is-strong",
  orange: "is-mid",
  rouge: "is-low",
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function PerformanceCard({
  agentPerformance,
  score,
}: {
  agentPerformance: AgentPerformanceBreakdown;
  /** Score 70/20/10 du commercial : quand il est fourni, la carte affiche le même chiffre que son donut. */
  score?: { score: number; couleur: CouleurScore };
}) {
  const performance = score ? Math.max(0, Math.min(100, score.score)) : clampPercent(agentPerformance.percent);
  const { byStage } = agentPerformance;
  const tone = score
    ? SCORE_TONES[score.couleur]
    : performance >= 70
      ? "is-strong"
      : performance >= 40
        ? "is-mid"
        : "is-low";
  const label = performance.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

  return (
    <article className={`dash-card welcome-perf ${tone}`} role="group" aria-label="Performance individuelle">
      <div className="welcome-perf-top">
        <div>
          <h3>Performance</h3>
          <p className="card-sub">
            {score
              ? "Avancement 70 % · Signatures 20 % · Volume 10 %"
              : "Création 5% · Lead 15% · Pipeline 30% · Finalisé 50%"}
          </p>
        </div>
        <p className="welcome-perf-score" aria-label={`Score ${label} pour cent`}>
          {score ? `${label} %` : <CountUp end={performance} duration={1200} suffix="%" />}
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
