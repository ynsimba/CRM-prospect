import Link from "next/link";
import ChartLegend from "./ChartLegend";
import CountUp from "./CountUp";

const size = 180;
const stroke = 28;
const radius = (size - stroke) / 2;
const circumference = 2 * Math.PI * radius;

type DonutChartCardProps = {
  open: number;
  won: number;
  lost: number;
};

export default function DonutChartCard({ open, won, lost }: DonutChartCardProps) {
  const total = open + won + lost;
  const raw = [
    { value: open, color: "#fcb040", label: "Pipeline" },
    { value: won, color: "#12a197", label: "Finalisé" },
    { value: lost, color: "#2f3990", label: "Rejeté" },
  ];
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
    <article className="dash-card chart-card">
      <div className="donut-head">
        <h3>Statuts</h3>
        <Link href="/pipeline" className="icon-btn" aria-label="Ouvrir le pipeline">
          <i className="bi bi-gear" />
        </Link>
      </div>

      <div className="donut-wrap">
        <svg
          className="donut-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Répartition du pipeline"
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
              key={segment.color}
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
          <CountUp end={total} duration={1600} format="fr" />
        </span>
      </div>

      <ChartLegend items={raw.map((item) => ({ color: item.color, label: item.label }))} />
    </article>
  );
}
