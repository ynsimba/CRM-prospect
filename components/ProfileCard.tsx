import CountUp from "./CountUp";
import { timeOfDayGreeting, welcomeDisplayName } from "@/lib/welcome";
import type { AgentPerformanceBreakdown } from "@/lib/dashboard-logic";

type ProfileCardProps = {
  name: string;
  initials: string;
  civility?: string | null;
  photoUrl?: string | null;
  overdue: number;
  agentPerformance: AgentPerformanceBreakdown;
  showPerformance?: boolean;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function ProfileCard({
  name,
  initials,
  civility,
  photoUrl = null,
  overdue,
  agentPerformance,
  showPerformance = true,
}: ProfileCardProps) {
  const now = new Date();
  const today = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Kinshasa",
  }).format(now);

  const firstName = name.trim().split(/\s+/).filter(Boolean)[0] ?? "";
  const shortLabel = welcomeDisplayName(firstName, civility);
  const greeting = timeOfDayGreeting(now, "Africa/Kinshasa");
  const title = shortLabel ? `${greeting} ${shortLabel}` : greeting;

  const performance = clampPercent(agentPerformance.percent);
  const { byStage } = agentPerformance;
  const tone = performance >= 70 ? "is-strong" : performance >= 40 ? "is-mid" : "is-low";

  return (
    <article className="welcome-banner">
      <div className="welcome-banner-glow" aria-hidden />
      <div className="welcome-banner-copy">
        <p className="welcome-banner-date">
          <i className="bi bi-calendar3" aria-hidden />
          <time dateTime={now.toISOString().slice(0, 10)}>{today}</time>
        </p>
        <h1 className="welcome-banner-title">{title}</h1>
        <p className="welcome-banner-text">
          {welcomeDisplayName(name, civility)} — voici l’essentiel de votre activité commerciale.
        </p>
        {overdue > 0 ? (
          <p className="welcome-banner-alert">
            <i className="bi bi-exclamation-circle" aria-hidden />
            <CountUp end={overdue} duration={1000} /> relance{overdue > 1 ? "s" : ""} en retard
          </p>
        ) : null}
      </div>

      <div className="welcome-banner-visual">
        {showPerformance ? (
          <div className={`welcome-perf ${tone}`} role="group" aria-label="Performance individuelle">
            <div className="welcome-perf-top">
              <div>
                <p className="welcome-perf-kicker">Performance</p>
                <p className="welcome-perf-label">Création 5% · Lead 15% · Pipeline 30% · Finalisé 50%</p>
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
          </div>
        ) : null}

        <div className="welcome-banner-identity">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="welcome-banner-avatar is-photo" aria-hidden />
          ) : (
            <span className="welcome-banner-avatar" aria-hidden>
              {initials}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
