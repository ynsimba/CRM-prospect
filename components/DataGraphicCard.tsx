import type { CSSProperties } from "react";
import Link from "next/link";
import CountUp from "./CountUp";

type CircularProgressProps = {
  percent: number;
  color: string;
  size?: number;
};

function CircularProgress({ percent, color, size = 86 }: CircularProgressProps) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#d8d8d8"
        strokeWidth={stroke}
      />
      <circle
        className="progress-ring"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={
          {
            "--circ": circumference,
            "--target": offset,
          } as CSSProperties
        }
      />
      <text
        x="50%"
        y="51%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="15"
        fontWeight="700"
        fill={color}
      >
        <CountUp end={percent} suffix="%" duration={1500} />
      </text>
    </svg>
  );
}

type DataGraphicCardProps = {
  percent: number;
  goal: number;
};

export default function DataGraphicCard({ percent, goal }: DataGraphicCardProps) {
  const onTrack = percent >= goal;

  return (
    <article className="dash-card">
      <div className="donut-head">
        <div>
          <h3>Rapports mensuels</h3>
          <p className="card-sub">Pourcentage de prospects passés au pipeline / objectif {goal}%</p>
        </div>
        <Link href="/rapports" className="icon-btn" aria-label="Ouvrir les rapports">
          <i className="bi bi-box-arrow-up-right" />
        </Link>
      </div>

      <div className="progress-row single">
        <div className="progress-block">
          <CircularProgress percent={percent} color={onTrack ? "#8dc438" : "#fcb040"} />
          <div className="progress-copy">
            <p>% Pipeline ce mois</p>
            <span className="amount">
              <CountUp end={percent} duration={1500} suffix="%" />
            </span>
            <span className={onTrack ? "badge-up" : "badge-tax"}>
              <i className={`bi ${onTrack ? "bi-caret-up-fill" : "bi-percent"}`} aria-hidden />
              Objectif {goal}%
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
