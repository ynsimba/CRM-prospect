import type { CSSProperties } from "react";
import Link from "next/link";
import Shell from "./Shell";
import ProfileCard from "./ProfileCard";
import PerformanceCard from "./PerformanceCard";
import PeriodSelect from "./PeriodSelect";
import MetricGrid from "./MetricGrid";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import DonutChartCard from "./DonutChartCard";
import DataGraphicCard from "./DataGraphicCard";
import AnalyticsCard from "./AnalyticsCard";
import RelanceKpiTable from "./RelanceKpiTable";
import type { DashboardStats } from "@/lib/dashboard";

const STATUS_COLORS: Record<string, string> = {
  opportunite: "#fbb040",
  lead: "#7b83eb",
  pipeline: "#2f6fe4",
  rejete: "#ef4444",
  finalise: "#6cc24a",
};
const SERIES_COLORS = ["#fbb040", "#7b83eb", "#2f6fe4", "#ef4444", "#6cc24a", "#07a8a3"];

type DashboardProps = {
  userName: string;
  civility?: string | null;
  stats: DashboardStats;
  activeHref?: string;
  showPerformance?: boolean;
};

export default function Dashboard({
  userName,
  civility,
  stats,
  activeHref = "/",
  showPerformance = true,
}: DashboardProps) {
  const byStatus = stats.barTitle === "Prospect";
  const series = stats.statusBars.map((point, index) => ({
    label: point.label,
    value: point.value,
    color: (point.slug && STATUS_COLORS[point.slug]) || SERIES_COLORS[index % SERIES_COLORS.length],
  }));

  return (
    <Shell activeHref={activeHref}>
      <div className="container-fluid p-0 dashboard-home">
        <div className="row g-3">
          <div className="col-12" style={{ "--i": 0 } as CSSProperties}>
            <ProfileCard name={userName} civility={civility} overdue={stats.overdue} />
          </div>

          <div className="col-12" style={{ "--i": 1 } as CSSProperties}>
            <MetricGrid metrics={stats.prospectKpis} variant="summary" />
          </div>

          {stats.teamProspects ? (
            <div className="col-12" style={{ "--i": 2 } as CSSProperties}>
              <article className="dash-card">
                <div className="company-head">
                  <div>
                    <h3>Prospects des commerciaux</h3>
                    <p className="card-sub">
                      Toutes les entreprises ajoutées par les agents — ajoute un commentaire pour le suivi.
                    </p>
                  </div>
                </div>
                {stats.teamProspects.length === 0 ? (
                  <p className="empty-copy">Aucun prospect saisi par les agents pour le moment.</p>
                ) : (
                  <RelanceKpiTable
                    items={stats.teamProspects}
                    showOwner
                    commentPlaceholder="Commentaire direction…"
                    refreshOnSave
                  />
                )}
              </article>
            </div>
          ) : null}

          <div className="col-12 col-lg-7" style={{ "--i": 3 } as CSSProperties}>
            <BarChartCard
              title={byStatus ? "Prospects par statut" : stats.barTitle}
              subtitle={stats.barSubtitle}
              action={<PeriodSelect value={stats.period} label="Période du graphique" />}
              points={series}
            />
          </div>
          <div className="col-12 col-lg-5" style={{ "--i": 4 } as CSSProperties}>
            <DonutChartCard
              title="Répartition globale"
              subtitle={byStatus ? "Statut de mes prospects" : "Prospects par commercial"}
              centerLabel="Prospects"
              action={<PeriodSelect value={stats.period} label="Période de la répartition" />}
              items={series}
            />
          </div>

          {stats.dormantBars.length > 0 || stats.overdueTaskBars.length > 0 ? (
            <>
              <div className="col-12 col-lg-6" style={{ "--i": 5 } as CSSProperties}>
                <BarChartCard
                  title="Prospects dormants"
                  subtitle="6 mois sans progression, par commercial"
                  href={stats.prospectsHref}
                  points={stats.dormantBars}
                />
              </div>
              <div className="col-12 col-lg-6" style={{ "--i": 6 } as CSSProperties}>
                <BarChartCard
                  title="Tâches en retard"
                  subtitle="Échéances dépassées, par commercial"
                  href="/taches"
                  points={stats.overdueTaskBars}
                />
              </div>
            </>
          ) : null}

          <div className="col-12" style={{ "--i": 7 } as CSSProperties}>
            <article className="dash-card tasks-card">
              <div className="chart-head">
                <span className="chart-head-icon is-large" aria-hidden>
                  <i className="bi bi-check2-square" />
                </span>
                <div className="chart-head-copy">
                  <h3>Mes tâches</h3>
                  <p className="card-sub">Suivi de mes activités</p>
                </div>
                <Link href="/taches" className="btn-tasks">
                  Voir toutes les tâches
                  <i className="bi bi-arrow-right" aria-hidden />
                </Link>
              </div>
              <MetricGrid metrics={stats.taskKpis} variant="tasks" />
            </article>
          </div>

          <div className="col-12 col-lg-8" style={{ "--i": 8 } as CSSProperties}>
            <AreaChartCard
              title="Évolution du statut pipeline mensuel"
              subtitle="Taux de réussite des affaires clôturées"
              href="/rapports"
              points={stats.monthlyWinRates}
              yMax={100}
              legendLabel="Taux de réussite"
              ariaLabel="Taux de réussite pipeline par mois"
            />
          </div>
          <div className="col-12 col-lg-4" style={{ "--i": 9 } as CSSProperties}>
            <AnalyticsCard overdue={stats.overdue} series={stats.analytics} />
          </div>
          <div className={showPerformance ? "col-12 col-lg-8" : "col-12"} style={{ "--i": 10 } as CSSProperties}>
            <DataGraphicCard
              pipelinePercent={stats.pipelinePercent}
              winPercent={stats.winPercent}
              goal={stats.pipelineGoal}
            />
          </div>
          {showPerformance ? (
            <div className="col-12 col-lg-4" style={{ "--i": 11 } as CSSProperties}>
              <PerformanceCard agentPerformance={stats.agentPerformance} />
            </div>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
