import type { CSSProperties } from "react";
import Link from "next/link";
import ChartLegend from "./ChartLegend";

const width = 640;
const height = 220;
const pad = { top: 12, right: 12, bottom: 36, left: 48 };
const chartW = width - pad.left - pad.right;
const chartH = height - pad.top - pad.bottom;
const BAR_COLORS = ["#f59e0b", "#fb923c", "#fbbf24", "#07a8a3", "#3b82f6", "#8b5cf6"];

function niceMax(value: number) {
  if (value <= 0) return 5;
  const mag = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / mag) * mag;
}

function shortLabel(name: string) {
  return name.length <= 11 ? name : `${name.slice(0, 10)}…`;
}

type BarChartCardProps = {
  title: string;
  subtitle: string;
  href?: string;
  points: { label: string; value: number }[];
};

export default function BarChartCard({ title, subtitle, href, points }: BarChartCardProps) {
  const values = points.map((item) => item.value);
  const maxY = niceMax(Math.max(...values, 0));
  const count = Math.max(points.length, 1);
  const gap = 8;
  const barW = Math.max(8, (chartW - gap * (count + 1)) / count);
  const ticks = [...new Set([0, 0.25, 0.5, 0.75, 1].map((part) => Math.round(maxY * part)))];

  function xAt(index: number) {
    return pad.left + gap + index * (barW + gap);
  }

  function yAt(value: number) {
    return pad.top + chartH - (value / maxY) * chartH;
  }

  return (
    <article className="dash-card chart-card">
      <div className="donut-head">
        <div>
          <h3>{title}</h3>
          <p className="card-sub">{subtitle}</p>
        </div>
        {href ? (
          <Link href={href} className="icon-btn" aria-label="Ouvrir le détail">
            <i className="bi bi-box-arrow-up-right" />
          </Link>
        ) : null}
      </div>
      <svg
        className="area-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${title} par statut`}
      >
        {ticks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="#efefef"
              strokeWidth="1"
            />
            <text x={pad.left - 8} y={yAt(tick) + 4} textAnchor="end" fontSize="11" fill="#b0b0b0">
              {tick}
            </text>
          </g>
        ))}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + chartH}
          y2={pad.top + chartH}
          stroke="#d8d8d8"
          strokeWidth="1"
        />
        {points.map((point, index) => {
          const x = xAt(index);
          const y = yAt(point.value);
          const h = pad.top + chartH - y;
          return (
            <rect
              key={point.label}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 0)}
              rx="4"
              fill={BAR_COLORS[index % BAR_COLORS.length]}
              style={{ "--i": index } as CSSProperties}
            />
          );
        })}
        {points.map((point, index) => (
          <text
            key={`${point.label}-x`}
            x={xAt(index) + barW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#b0b0b0"
          >
            {shortLabel(point.label)}
          </text>
        ))}
      </svg>
      <ChartLegend items={[{ color: "#f59e0b", label: "Nombre" }]} />
    </article>
  );
}
