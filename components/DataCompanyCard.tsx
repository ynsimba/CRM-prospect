import type { CSSProperties } from "react";
import Link from "next/link";
import CountUp from "./CountUp";
import type { DashboardKpi } from "@/lib/dashboard";

type DataCompanyCardProps = {
  title: string;
  subtitle: string;
  actionHref?: string;
  actionLabel?: string;
  metrics: DashboardKpi[];
};

export default function DataCompanyCard({
  title,
  subtitle,
  actionHref,
  actionLabel,
  metrics,
}: DataCompanyCardProps) {
  return (
    <article className="dash-card">
      <div className="company-head">
        <div>
          <h3>{title}</h3>
          <p className="card-sub">{subtitle}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="btn-download">
            {actionLabel}
            <i className="bi bi-box-arrow-up-right" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="metric-grid">
        {metrics.map((metric, index) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={`metric-box ${metric.tone}`}
            style={{ "--i": index } as CSSProperties}
          >
            <span className="metric-label">{metric.label}</span>
            {metric.hint ? <span className="metric-hint">{metric.hint}</span> : null}
            <span className="metric-value">
              <CountUp end={metric.value} duration={1400} suffix={metric.suffix ?? ""} />
            </span>
          </Link>
        ))}
      </div>
    </article>
  );
}
