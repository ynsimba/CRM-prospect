import type { CSSProperties } from "react";
import Shell from "./Shell";
import ProfileCard from "./ProfileCard";
import DataCompanyCard from "./DataCompanyCard";
import BarChartCard from "./BarChartCard";
import AreaChartCard from "./AreaChartCard";
import DataGraphicCard from "./DataGraphicCard";
import type { DashboardStats } from "@/lib/dashboard";

type DashboardProps = {
  userName: string;
  userInitials: string;
  roleLabel: string;
  stats: DashboardStats;
};

export default function Dashboard({ userName, userInitials, roleLabel, stats }: DashboardProps) {
  return (
    <Shell activeHref="/">
      <div className="container-fluid p-0">
        <div className="row g-3">
          <div className="col-12 col-lg-4" style={{ "--i": 0 } as CSSProperties}>
            <ProfileCard
              name={userName}
              initials={userInitials}
              roleLabel={roleLabel}
              overdue={stats.overdue}
            />
          </div>
          <div className="col-12 col-lg-8" style={{ "--i": 1 } as CSSProperties}>
            <DataCompanyCard
              title="Dashboard"
              subtitle="Dashboard utilisateur — prospects actifs, relances et pipeline."
              actionHref="/prospects"
              actionLabel="Voir les prospects"
              metrics={stats.prospectKpis}
            />
          </div>
          <div className="col-12" style={{ "--i": 2 } as CSSProperties}>
            <BarChartCard
              title="Prospect"
              subtitle="Prospects selon leur position dans le parcours de conversion"
              href="/prospects"
              points={stats.statusBars}
            />
          </div>
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
            <DataGraphicCard percent={stats.pipelinePercent} goal={stats.pipelineGoal} />
          </div>
        </div>
      </div>
    </Shell>
  );
}
