import type { CSSProperties } from "react";
import Link from "next/link";
import Shell from "./Shell";
import ProfileCard from "./ProfileCard";
import MetricGrid from "./MetricGrid";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import DonutChartCard from "./DonutChartCard";
import DataGraphicCard from "./DataGraphicCard";
import AnalyticsCard from "./AnalyticsCard";
import RelanceKpiTable from "./RelanceKpiTable";
import type { DashboardStats } from "@/lib/dashboard";

type DashboardProps = {
  userName: string;
  userInitials: string;
  civility?: string | null;
  photoUrl?: string | null;
  stats: DashboardStats;
  activeHref?: string;
};

export default function Dashboard({
  userName,
  userInitials,
  civility,
  photoUrl = null,
  stats,
  activeHref = "/",
}: DashboardProps) {
  const summaryKpis = stats.prospectKpis.slice(0, 3);
  const statusDonut = stats.statusBars.map((point, index) => ({
    label: point.label,
    value: point.value,
    color: ["#f59e0b", "#22c55e", "#3b82f6", "#ef4444", "#8b5cf6", "#07a8a3"][index % 6],
  }));

  return (
    <Shell activeHref={activeHref}>
      <div className="container-fluid p-0 dashboard-home">
        <div className="row g-3">
          <div className="col-12" style={{ "--i": 0 } as CSSProperties}>
            <ProfileCard
              name={userName}
              initials={userInitials}
              civility={civility}
              photoUrl={photoUrl}
              overdue={stats.overdue}
              agentPerformance={stats.agentPerformance}
            />
          </div>

          <div className="col-12" style={{ "--i": 1 } as CSSProperties}>
            <MetricGrid metrics={summaryKpis} variant="summary" />
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
              title={stats.barTitle === "Prospect" ? "Prospects par statut" : stats.barTitle}
              subtitle={stats.barSubtitle}
              href={stats.prospectsHref}
              points={stats.statusBars}
            />
          </div>
          <div className="col-12 col-lg-5" style={{ "--i": 4 } as CSSProperties}>
            <DonutChartCard
              title="Répartition globale"
              centerLabel="Prospects"
              items={statusDonut.length > 0 ? statusDonut : undefined}
              open={stats.pipelineMix.open}
              won={stats.pipelineMix.won}
              lost={stats.pipelineMix.lost}
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
            <div className="section-head">
              <div>
                <h3>Mes tâches</h3>
                <p className="card-sub">Suivi rapide de votre charge de travail</p>
              </div>
              <Link href="/taches" className="btn-download">
                Voir toutes les tâches
                <i className="bi bi-arrow-right" aria-hidden />
              </Link>
            </div>
            <MetricGrid metrics={stats.taskKpis} variant="tasks" />
          </div>

          {stats.prospectKpis.length > 3 ? (
            <div className="col-12" style={{ "--i": 8 } as CSSProperties}>
              <article className="dash-card">
                <div className="company-head">
                  <div>
                    <h3>Tous les compteurs</h3>
                    <p className="card-sub">
                      {stats.teamProspects
                        ? "Tous les prospects saisis par les agents — cliquer un compteur pour commenter."
                        : "Compteurs Safecheck — Opportunité, Lead, Pipeline, Rejeté, Finalisé."}
                    </p>
                  </div>
                  <Link href={stats.prospectsHref} className="btn-download">
                    Voir les prospects
                    <i className="bi bi-box-arrow-up-right" aria-hidden />
                  </Link>
                </div>
                <MetricGrid metrics={stats.prospectKpis} variant="summary" />
              </article>
            </div>
          ) : null}

          <div className="col-12 col-lg-8" style={{ "--i": 9 } as CSSProperties}>
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
          <div className="col-12 col-lg-4" style={{ "--i": 10 } as CSSProperties}>
            <AnalyticsCard overdue={stats.overdue} series={stats.analytics} />
          </div>
          <div className="col-12" style={{ "--i": 11 } as CSSProperties}>
            <DataGraphicCard
              pipelinePercent={stats.pipelinePercent}
              winPercent={stats.winPercent}
              goal={stats.pipelineGoal}
            />
          </div>
        </div>
      </div>
    </Shell>
  );
}
