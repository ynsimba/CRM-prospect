import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

const pad = { top: 24, right: 12, bottom: 28, left: 34 };
/** Deux tracés du même graphique : large (bureau) et compact (téléphone), choisis en CSS. */
const LAYOUTS = [
  { name: "wide", width: 680, height: 204, maxBar: 76, maxLabel: 14 },
  { name: "compact", width: 340, height: 210, maxBar: 40, maxLabel: 9 },
] as const;
const BAR_COLORS = ["#fbb040", "#7b83eb", "#2f6fe4", "#ef4444", "#6cc24a", "#07a8a3"];

/** Pas « rond » (1, 2, 5 × 10ⁿ) pour une graduation d’environ cinq lignes. */
function niceStep(max: number) {
  const rough = max / 5;
  if (rough <= 1) return 1;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
}

function shortLabel(name: string, max: number) {
  return name.length <= max ? name : `${name.slice(0, max - 1)}…`;
}

type BarChartCardProps = {
  title: string;
  subtitle: string;
  icon?: string;
  href?: string;
  action?: ReactNode;
  points: { label: string; value: number; color?: string }[];
};

export default function BarChartCard({ title, subtitle, icon = "bi-bar-chart-fill", href, action, points }: BarChartCardProps) {
  const max = Math.max(...points.map((item) => item.value), 0);
  const step = niceStep(max);
  // Une graduation de marge au-dessus de la plus haute barre, pour loger son étiquette.
  const maxY = Math.max(5 * step, (Math.floor(max / step) + 1) * step);
  const ticks = Array.from({ length: Math.round(maxY / step) + 1 }, (_, index) => index * step);

  return (
    <article className="dash-card chart-card">
      <div className="chart-head">
        <span className="chart-head-icon" aria-hidden>
          <i className={`bi ${icon}`} />
        </span>
        <div className="chart-head-copy">
          <h3>{title}</h3>
          <p className="card-sub">{subtitle}</p>
        </div>
        {action ??
          (href ? (
            <Link href={href} className="icon-btn" aria-label="Ouvrir le détail">
              <i className="bi bi-box-arrow-up-right" />
            </Link>
          ) : null)}
      </div>
      {LAYOUTS.map(({ name, width, height, maxBar, maxLabel }) => {
        const chartW = width - pad.left - pad.right;
        const chartH = height - pad.top - pad.bottom;
        const band = chartW / Math.max(points.length, 1);
        const barW = Math.min(maxBar, band * 0.56);
        const baseline = pad.top + chartH;
        const yAt = (value: number) => baseline - (value / maxY) * chartH;
        return (
          <svg
            key={name}
            className={`bar-chart is-${name}`}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={title}
          >
            {ticks.map((tick) => (
              <g key={`y-${tick}`}>
                <line
                  className={tick === 0 ? "bar-chart-axis" : "bar-chart-grid"}
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={yAt(tick)}
                  y2={yAt(tick)}
                />
                <text className="bar-chart-tick" x={pad.left - 12} y={yAt(tick) + 4} textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
            {points.map((point, index) => {
              const x = pad.left + band * index + (band - barW) / 2;
              const y = yAt(point.value);
              const r = Math.min(6, (baseline - y) / 2);
              const cx = x + barW / 2;
              return (
                <g key={point.label} style={{ "--i": index } as CSSProperties}>
                  {point.value > 0 ? (
                    <path
                      d={`M${x} ${baseline} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + barW - r} Q${x + barW} ${y} ${x + barW} ${y + r} V${baseline} Z`}
                      fill={point.color ?? BAR_COLORS[index % BAR_COLORS.length]}
                    />
                  ) : null}
                  <circle className="bar-chart-pill" cx={cx} cy={y - 13} r="10" />
                  <text className="bar-chart-value" x={cx} y={y - 9.5} textAnchor="middle">
                    {point.value}
                  </text>
                  <text className="bar-chart-label" x={cx} y={height - 8} textAnchor="middle">
                    {shortLabel(point.label, maxLabel)}
                  </text>
                </g>
              );
            })}
          </svg>
        );
      })}
    </article>
  );
}
