import Link from "next/link";
import MetricGrid from "./MetricGrid";
import type { DashboardKpi } from "@/lib/dashboard-logic";

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

      <MetricGrid metrics={metrics} />
    </article>
  );
}
