import type { CSSProperties } from "react";
import Link from "next/link";
import ChartLegend from "./ChartLegend";

const width = 640;
const height = 220;
const pad = { top: 12, right: 12, bottom: 28, left: 48 };
const chartW = width - pad.left - pad.right;
const chartH = height - pad.top - pad.bottom;

function niceMax(value: number) {
  if (value <= 0) return 100;
  const mag = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / mag) * mag;
}

type AreaChartCardProps = {
  title?: string;
  subtitle?: string;
  href?: string;
  points: { label: string; value: number }[];
  yMax?: number;
  legendLabel?: string;
  ariaLabel?: string;
};

export default function AreaChartCard({
  title,
  subtitle,
  href,
  points,
  yMax,
  legendLabel = "Prospects",
  ariaLabel = "Évolution sur 12 mois",
}: AreaChartCardProps) {
  const values = points.map((item) => item.value);
  const maxY = yMax ?? niceMax(Math.max(...values, 0));
  const labels = points.map((item) => item.label);

  function xAt(index: number) {
    return pad.left + (index / Math.max(values.length - 1, 1)) * chartW;
  }

  function yAt(value: number) {
    return pad.top + chartH - (value / maxY) * chartH;
  }

  const linePath = values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${xAt(index)} ${yAt(value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xAt(values.length - 1)} ${pad.top + chartH} L ${xAt(0)} ${pad.top + chartH} Z`;
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(maxY * part)))];

  return (
    <article className="dash-card chart-card">
      {title ? (
        <div className="donut-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="card-sub">{subtitle}</p> : null}
          </div>
          {href ? (
            <Link href={href} className="icon-btn" aria-label="Ouvrir le détail">
              <i className="bi bi-box-arrow-up-right" />
            </Link>
          ) : null}
        </div>
      ) : null}
      <svg className="area-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        {labels.map((label, index) => {
          const x = xAt(index);
          return (
            <line
              key={`grid-${label}-${index}`}
              x1={x}
              x2={x}
              y1={pad.top}
              y2={pad.top + chartH}
              stroke="#efefef"
              strokeWidth="1"
            />
          );
        })}

        {ticks.map((tick) => (
          <text key={`y-${tick}`} x={pad.left - 8} y={yAt(tick) + 4} textAnchor="end" fontSize="11" fill="#b0b0b0">
            {tick}
          </text>
        ))}

        <path className="chart-area" d={areaPath} fill="rgba(252, 176, 64, 0.22)" />
        <path
          className="chart-line"
          d={linePath}
          pathLength={1}
          fill="none"
          stroke="#fcb040"
          strokeWidth="2.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {values.map((value, index) => (
          <circle
            key={labels[index]}
            className="chart-dot"
            style={{ "--i": index } as CSSProperties}
            cx={xAt(index)}
            cy={yAt(value)}
            r="5.2"
            fill="#fcb040"
            stroke="#1c1c1c"
            strokeWidth="1.5"
          />
        ))}

        {labels.map((label, index) => (
          <text
            key={`${label}-x`}
            x={xAt(index)}
            y={height - 6}
            textAnchor="middle"
            fontSize="11"
            fill="#b0b0b0"
          >
            {label}
          </text>
        ))}
      </svg>
      <ChartLegend items={[{ color: "#fcb040", label: legendLabel }]} />
    </article>
  );
}
