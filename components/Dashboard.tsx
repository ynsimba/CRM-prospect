import type { CSSProperties } from "react";
import Shell from "./Shell";
import ProfileCard from "./ProfileCard";
import DataCompanyCard from "./DataCompanyCard";
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
  stats: DashboardStats;
  activeHref?: string;
};

export default function Dashboard({ userName, userInitials, civility, stats, activeHref = "/" }: DashboardProps) {
  return (
    <Shell activeHref={activeHref}>
      <div className="container-fluid p-0">
        <div className="row g-3">
          <div className="col-12 col-lg-4" style={{ "--i": 0 } as CSSProperties}>
            <ProfileCard
              name={userName}
              initials={userInitials}
              civility={civility}
              overdue={stats.overdue}
            />
          </div>
          <div className="col-12 col-lg-8" style={{ "--i": 1 } as CSSProperties}>
            <DataCompanyCard
              title="Dashboard"
              subtitle={
                stats.teamProspects
                  ? "Tous les prospects saisis par les agents — cliquer un compteur pour commenter."
                  : "Compteurs Safecheck — Opportunité, Lead, Pipeline, Rejeté, Finalisé."
              }
              actionHref={stats.prospectsHref}
              actionLabel="Voir les prospects"
              metrics={stats.prospectKpis}
            />
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
          <div className="col-12" style={{ "--i": 3 } as CSSProperties}>
            <BarChartCard
              title={stats.barTitle}
              subtitle={stats.barSubtitle}
              href={stats.prospectsHref}
              points={stats.statusBars}
            />
          </div>
          {stats.dormantBars.length > 0 || stats.overdueTaskBars.length > 0 ? (
            <>
              <div className="col-12 col-lg-6" style={{ "--i": 3 } as CSSProperties}>
                <BarChartCard
                  title="Prospects dormants"
                  subtitle="6 mois sans progression, par commercial"
                  href={stats.prospectsHref}
                  points={stats.dormantBars}
                />
              </div>
              <div className="col-12 col-lg-6" style={{ "--i": 4 } as CSSProperties}>
                <BarChartCard
                  title="Tâches en retard"
                  subtitle="Échéances dépassées, par commercial"
                  href="/taches"
                  points={stats.overdueTaskBars}
                />
              </div>
            </>
          ) : null}
          <div className="col-12" style={{ "--i": 3 } as CSSProperties}>
            <DataCompanyCard
              title="Tâches"
              subtitle="Mes tâches en cours"
              actionHref="/taches"
              actionLabel="Voir les tâches"
              metrics={stats.taskKpis}
            />
          </div>
          <div className="col-12 col-lg-8" style={{ "--i": 4 } as CSSProperties}>
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
          <div className="col-12 col-lg-4" style={{ "--i": 5 } as CSSProperties}>
            <DonutChartCard
              open={stats.pipelineMix.open}
              won={stats.pipelineMix.won}
              lost={stats.pipelineMix.lost}
            />
          </div>
          <div className="col-12 col-lg-8" style={{ "--i": 6 } as CSSProperties}>
            <DataGraphicCard
              pipelinePercent={stats.pipelinePercent}
              winPercent={stats.winPercent}
              goal={stats.pipelineGoal}
            />
          </div>
          <div className="col-12 col-lg-4" style={{ "--i": 7 } as CSSProperties}>
            <AnalyticsCard overdue={stats.overdue} series={stats.analytics} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
