"use client";

import { useState } from "react";
import CountUp from "./CountUp";
import type { AnalyticsRange } from "@/lib/report-logic";

const ranges: AnalyticsRange[] = ["Tout", "Cette année", "Ce mois", "Cette semaine"];

function sparkPath(values: number[]) {
  const width = 280;
  const height = 70;
  const max = Math.max(...values, 1);
  return values.map((value, index) => {
    const x = 4 + (index / Math.max(values.length - 1, 1)) * (width - 8);
    const y = height - 10 - (value / max) * (height - 20);
    return { x, y, cmd: `${index === 0 ? "M" : "L"} ${x} ${y}` };
  });
}

type AnalyticsCardProps = {
  overdue: number;
  series: Record<AnalyticsRange, { total: number; spark: number[]; caption: string }>;
};

export default function AnalyticsCard({ overdue, series }: AnalyticsCardProps) {
  const [range, setRange] = useState<AnalyticsRange>("Cette semaine");
  const [open, setOpen] = useState(false);
  const current = series[range];
  const spark = current.spark.length ? current.spark : [0, 0, 0, 0, 0, 0, 0];
  const points = sparkPath(spark);
  const path = points.map((item) => item.cmd).join(" ");
  const last = spark[spark.length - 1] ?? 0;
  const lastPoint = points[points.length - 1];

  return (
    <article className="dash-card">
      <div className="analytics-toolbar">
        <form action="/prospects" method="get" className="search-box">
          <i className="bi bi-search" aria-hidden />
          <input
            type="search"
            name="q"
            placeholder="Prospects, e-mail, téléphone"
            aria-label="Rechercher un prospect"
          />
        </form>

        <div className="position-relative">
          <button
            type="button"
            className="btn-lifetime"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            {range}
            <i className="bi bi-caret-down-fill" aria-hidden />
          </button>
          {open && (
            <div className="range-menu">
              {ranges.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item);
                    setOpen(false);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="analytics-meta">
        <p className="analytics-value">
          <CountUp end={current.total} duration={1600} format="fr" />
        </p>
        <p className="analytics-label">
          Activités · relances en retard {overdue.toLocaleString("fr-CD")}
        </p>
      </div>

      <svg className="sparkline" viewBox="0 0 280 70" role="img" aria-label={current.caption}>
        <path
          className="spark-line"
          d={path}
          pathLength={1}
          fill="none"
          stroke="#07a8a3"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle
          className="spark-dot"
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="5"
          fill="#07a8a3"
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>
      <p className="muted-line" style={{ marginTop: 8 }}>
        {current.caption} · {last.toLocaleString("fr-CD")}
      </p>
    </article>
  );
}
