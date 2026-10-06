import type { ReactNode } from "react";
import CountUp from "./CountUp";

const size = 200;
const stroke = 38;
const center = size / 2;
const radius = (size - stroke) / 2;
/** Espace laissé entre deux segments voisins, mesuré le long de l’anneau. */
const GAP = 3;

/** Point de l’anneau à `turn` tour(s) depuis midi, dans le sens horaire. */
function ringPoint(turn: number) {
  const angle = turn * 2 * Math.PI;
  return `${(center + radius * Math.sin(angle)).toFixed(2)} ${(center - radius * Math.cos(angle)).toFixed(2)}`;
}

/** Arc exact entre deux positions : pas de pointillé, donc pas de bavure à la jointure. */
function arcPath(from: number, to: number) {
  return `M${ringPoint(from)} A${radius} ${radius} 0 ${to - from > 0.5 ? 1 : 0} 1 ${ringPoint(to)}`;
}

type DonutItem = {
  label: string;
  value: number;
  color: string;
};

type DonutChartCardProps = {
  title: string;
  subtitle?: string;
  centerLabel?: string;
  action?: ReactNode;
  items: DonutItem[];
};

export default function DonutChartCard({ title, subtitle, centerLabel, action, items }: DonutChartCardProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items.map((item, index) => {
    const share = total > 0 ? item.value / total : 0;
    const before = items.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
    return { ...item, share, start: total > 0 ? before / total : 0 };
  });
  const drawn = segments.filter((segment) => segment.value > 0);
  // Demi-espace retiré à chaque extrémité, en fraction de tour ; inutile quand un seul segment fait le tour.
  const pad = drawn.length > 1 ? GAP / 2 / (2 * Math.PI * radius) : 0;

  return (
    <article className="dash-card chart-card donut-card-rich">
      <div className="chart-head">
        <span className="chart-head-icon" aria-hidden>
          <i className="bi bi-pie-chart" />
        </span>
        <div className="chart-head-copy">
          <h3>{title}</h3>
          {subtitle ? <p className="card-sub">{subtitle}</p> : null}
        </div>
        {action}
      </div>

      <div className="donut-rich-body">
        <div className="donut-wrap">
          <svg className="donut-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
            <circle className="donut-track" cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} />
            {drawn.map((segment) => {
              const tip = `${segment.label} : ${segment.value} (${Math.round(segment.share * 100)} %)`;
              return drawn.length === 1 ? (
                <circle
                  key={segment.label}
                  className="donut-seg"
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                >
                  <title>{tip}</title>
                </circle>
              ) : (
                <path
                  key={segment.label}
                  className="donut-seg"
                  // Un segment très fin garde au moins un trait visible.
                  d={arcPath(segment.start + pad, Math.max(segment.start + segment.share - pad, segment.start + pad + 0.002))}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={stroke}
                >
                  <title>{tip}</title>
                </path>
              );
            })}
          </svg>
          <span className="donut-center">
            <strong>
              <CountUp end={total} duration={1600} format="fr" />
            </strong>
            {centerLabel ? <small>{centerLabel}</small> : null}
          </span>
        </div>

        <ul className="donut-stats">
          {segments.map((segment) => (
            <li key={segment.label}>
              <span className="donut-stats-swatch" style={{ background: segment.color }} />
              <span className="donut-stats-label">{segment.label}</span>
              <span className="donut-stats-value">{segment.value}</span>
              <span className={`donut-stats-pct ${segment.value > 0 ? "is-active" : ""}`}>
                {Math.round(segment.share * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
