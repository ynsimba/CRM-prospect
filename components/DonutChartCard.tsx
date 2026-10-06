import type { ReactNode } from "react";
import CountUp from "./CountUp";

const size = 200;
const stroke = 38;
const radius = (size - stroke) / 2;
const circumference = 2 * Math.PI * radius;

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
    const offset = items.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
    return {
      ...item,
      share,
      length: share * circumference,
      offset: total > 0 ? (offset / total) * circumference : 0,
    };
  });

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
            <circle className="donut-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
            {segments.map((segment) => (
              <circle
                key={`${segment.label}-${segment.color}`}
                className="donut-seg"
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={stroke}
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={-segment.offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            ))}
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
