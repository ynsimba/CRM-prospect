import Link from "next/link";
import CountUp from "./CountUp";

const size = 180;
const stroke = 28;
const radius = (size - stroke) / 2;
const circumference = 2 * Math.PI * radius;

type DonutItem = {
  label: string;
  value: number;
  color: string;
};

type DonutChartCardProps = {
  open?: number;
  won?: number;
  lost?: number;
  title?: string;
  centerLabel?: string;
  items?: DonutItem[];
};

export default function DonutChartCard({
  open = 0,
  won = 0,
  lost = 0,
  title = "Statuts",
  centerLabel,
  items,
}: DonutChartCardProps) {
  const raw: DonutItem[] =
    items && items.length > 0
      ? items
      : [
          { value: open, color: "#fcb040", label: "Pipeline" },
          { value: won, color: "#12a197", label: "Finalisé" },
          { value: lost, color: "#2f3990", label: "Rejeté" },
        ];

  const total = raw.reduce((sum, item) => sum + item.value, 0);
  const denom = total > 0 ? total : 1;
  const segments = raw.map((item) => ({
    ...item,
    share: total > 0 ? item.value / denom : 0,
  }));

  const donutSegments = segments.map((segment, index) => {
    const length = segment.share * circumference;
    const offset = segments.slice(0, index).reduce((sum, item) => sum + item.share * circumference, 0);
    return { ...segment, length, offset };
  });

  return (
    <article className="dash-card chart-card donut-card-rich">
      <div className="donut-head">
        <h3>{title}</h3>
        <Link href="/pipeline" className="icon-btn" aria-label="Ouvrir le pipeline">
          <i className="bi bi-gear" />
        </Link>
      </div>

      <div className="donut-rich-body">
        <div className="donut-wrap">
          <svg
            className="donut-svg"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Répartition globale"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f3f3f3"
              strokeWidth={stroke}
            />
            {donutSegments.map((segment) => (
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
              <span className="donut-stats-pct">{Math.round(segment.share * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
