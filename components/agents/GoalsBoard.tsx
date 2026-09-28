import { dailyNeeded, goalStatus, monthPace, type GoalMetricKey, type GoalStatus } from "@/lib/agent-cockpit-logic";

type GoalRow = { key: GoalMetricKey; label: string; achieved: number; target: number; pct: number | null };

export const GOAL_VISUALS: Record<GoalMetricKey, { icon: string; accent: string; unit: string }> = {
  prospects: { icon: "bi-person-check", accent: "blue", unit: "prospects" },
  calls: { icon: "bi-telephone", accent: "teal", unit: "appels" },
  meetings: { icon: "bi-calendar-event", accent: "violet", unit: "RDV" },
  proposals: { icon: "bi-file-earmark-text", accent: "amber", unit: "propositions" },
  conversions: { icon: "bi-trophy", accent: "pink", unit: "conversions" },
};

const STATUS: Record<GoalStatus, { label: string; icon: string }> = {
  none: { label: "Non défini", icon: "bi-dash-circle" },
  done: { label: "Atteint", icon: "bi-check-circle-fill" },
  "on-track": { label: "En bonne voie", icon: "bi-graph-up-arrow" },
  "at-risk": { label: "À surveiller", icon: "bi-exclamation-triangle-fill" },
  behind: { label: "En retard", icon: "bi-exclamation-octagon-fill" },
};

const nf = new Intl.NumberFormat("fr-CD");
const fmt = (_key: GoalMetricKey, value: number) => nf.format(value);

function Ring({ pct }: { pct: number }) {
  const size = 132;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.min(pct, 100) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="goal-ring" aria-hidden>
      <defs>
        <linearGradient id="goal-ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8dc438" />
          <stop offset="100%" stopColor="#3d6a33" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} className="goal-ring-track" strokeWidth={stroke} />
      {filled > 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="goal-ring-fill"
          strokeWidth={stroke}
          stroke="url(#goal-ring-grad)"
          strokeDasharray={`${filled} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      ) : null}
    </svg>
  );
}

/** Objectives module (§7): monthly summary, one card per goal with pace, status and remaining effort. */
export default function GoalsBoard({ rows, monthLabel, now = new Date() }: { rows: GoalRow[]; monthLabel: string; now?: Date }) {
  const pace = monthPace(now);
  const visible = rows;
  const defined = visible.filter((row) => row.target > 0);
  const reached = defined.filter((row) => row.achieved >= row.target).length;
  const overall = defined.length
    ? Math.round(defined.reduce((sum, row) => sum + Math.min(row.achieved / row.target, 1), 0) / defined.length * 100)
    : 0;
  const expectedPct = Math.round(pace.elapsed * 100);
  const globalStatus = defined.length ? goalStatus(overall, 100, pace.elapsed) : "none";

  return (
    <div className="goals-board">
      <section className="goals-summary" aria-label={`Synthèse des objectifs de ${monthLabel}`}>
        <div className="goals-summary-ring">
          <Ring pct={overall} />
          <span className="goals-summary-pct">
            <strong>{defined.length ? `${overall} %` : "—"}</strong>
            <span>réalisé</span>
          </span>
        </div>
        <div className="goals-summary-body">
          <p className="goals-summary-kicker">Objectifs de {monthLabel}</p>
          <h3 className="goals-summary-title">
            {defined.length === 0
              ? "Aucun objectif défini pour ce mois"
              : `${reached} objectif${reached > 1 ? "s" : ""} atteint${reached > 1 ? "s" : ""} sur ${defined.length}`}
          </h3>
          <div className="goals-summary-meta">
            <span className={`goal-status is-${globalStatus}`}>
              <i className={`bi ${STATUS[globalStatus].icon}`} aria-hidden /> {STATUS[globalStatus].label}
            </span>
            <span className="goals-summary-days">
              <i className="bi bi-calendar3" aria-hidden /> Jour {pace.day} sur {pace.daysInMonth} ·{" "}
              {pace.remainingDays === 0 ? "dernier jour" : `${pace.remainingDays} jour${pace.remainingDays > 1 ? "s" : ""} restant${pace.remainingDays > 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="goals-month-track" role="img" aria-label={`${expectedPct} % du mois écoulé`}>
            <span className="goals-month-fill" style={{ width: `${expectedPct}%` }} />
          </div>
          <p className="goals-month-caption">{expectedPct} % du mois écoulé — c’est le rythme attendu, repéré sur chaque objectif.</p>
        </div>
      </section>

      <ul className="goal-cards">
        {visible.map((row) => {
          const visual = GOAL_VISUALS[row.key];
          const status = goalStatus(row.achieved, row.target, pace.elapsed);
          const pct = row.target ? Math.round((row.achieved / row.target) * 100) : 0;
          const perDay = row.target ? dailyNeeded(row.achieved, row.target, pace.remainingDays) : 0;
          const left = Math.max(row.target - row.achieved, 0);
          return (
            <li key={row.key} className={`goal-card accent-${visual.accent} is-${status}`}>
              <div className="goal-card-head">
                <span className="goal-card-icon" aria-hidden>
                  <i className={`bi ${visual.icon}`} />
                </span>
                <span className="goal-card-label">{row.label}</span>
                <span className={`goal-status is-${status}`}>
                  <i className={`bi ${STATUS[status].icon}`} aria-hidden /> {STATUS[status].label}
                </span>
              </div>
              <p className="goal-card-figures">
                <strong>{fmt(row.key, row.achieved)}</strong>
                <span> / {row.target ? fmt(row.key, row.target) : "—"}</span>
              </p>
              <div
                className="goal-card-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={row.target ? Math.min(pct, 100) : undefined}
                aria-label={`${row.label} : ${row.target ? `${pct} % de l’objectif` : "pas d’objectif"}`}
              >
                <span className="goal-card-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                {row.target && status !== "done" ? (
                  <span className="goal-card-pace" style={{ left: `${expectedPct}%` }} title="Rythme attendu à ce jour" />
                ) : null}
              </div>
              <p className="goal-card-foot">
                {!row.target ? (
                  <>
                    <i className="bi bi-plus-circle" aria-hidden /> Définis un objectif ci-dessous
                  </>
                ) : status === "done" ? (
                  <>
                    <i className="bi bi-stars" aria-hidden /> Objectif dépassé de {fmt(row.key, row.achieved - row.target)} ({pct} %)
                  </>
                ) : (
                  <>
                    <strong>{pct} %</strong> · encore {fmt(row.key, left)}
                    {` ${visual.unit}`}
                    {perDay > 0 ? ` · ≈ ${perDay}/jour` : ""}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
