import Link from "next/link";
import Shell from "@/components/Shell";
import { parseYearMonth } from "@/lib/activity-logic";
import { requirePermission } from "@/lib/auth";
import { conversionPercent } from "@/lib/report-logic";
import { formatFc } from "@/lib/money";
import { PERMISSIONS } from "@/lib/permissions";
import { getReports } from "@/lib/reports";
import { stagePillClass } from "@/lib/pipeline-logic";
import { statusPillClass } from "@/lib/crm";
import type { Row } from "@/lib/prisma";

const MONTH_LABELS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function formatRate(value: number) {
  return `${value.toLocaleString("fr-CD", { maximumFractionDigits: 1 })} %`;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.reportsRead);
  const { month: monthParam } = await searchParams;
  const { year, monthIndex } = parseYearMonth(monthParam);
  const prev = new Date(year, monthIndex - 1, 1);
  const next = new Date(year, monthIndex + 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const report = await getReports(session, year, monthIndex);
  const { kpis } = report;

  return (
    <Shell activeHref="/rapports">
      <div className="page-head">
        <div>
          <h1 className="page-title">Rapports</h1>
          <p className="card-sub">
            {MONTH_LABELS[monthIndex]} {year} · conversion affaires {formatRate(kpis.dealConversion)} · pipeline{" "}
            {formatFc(kpis.pipelineValue)}
          </p>
        </div>
        <div className="page-head-actions">
          <Link href={`/rapports?month=${prevKey}`} className="table-action">
            Mois précédent
          </Link>
          <Link href={`/rapports?month=${nextKey}`} className="table-action">
            Mois suivant
          </Link>
          <Link href={`/rapports/export?month=${monthKey}`} className="btn-download">
            Exporter CSV
          </Link>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <h3>Indicateurs</h3>
        <p className="card-sub">Volume du mois, pipeline actuel, affaires clôturées.</p>
        <div className="table-wrap">
          <table className="data-table">
            <tbody>
              <tr>
                <td>Nouveaux prospects</td>
                <td>{kpis.newProspects}</td>
                <td>Contactés</td>
                <td>{kpis.contacted}</td>
              </tr>
              <tr>
                <td>Qualifiés</td>
                <td>{kpis.qualified}</td>
                <td>Convertis</td>
                <td>{kpis.converted}</td>
              </tr>
              <tr>
                <td>Perdus (prospects)</td>
                <td>{kpis.lostProspects}</td>
                <td>Activités</td>
                <td>{kpis.activities}</td>
              </tr>
              <tr>
                <td>Opportunités ouvertes</td>
                <td>{kpis.openOps}</td>
                <td>Affaires gagnées</td>
                <td>{kpis.wonOps}</td>
              </tr>
              <tr>
                <td>Affaires perdues</td>
                <td>{kpis.lostOps}</td>
                <td>CA gagné</td>
                <td>{formatFc(kpis.wonRevenue)}</td>
              </tr>
              <tr>
                <td>Valeur pipeline</td>
                <td>{formatFc(kpis.pipelineValue)}</td>
                <td>CA potentiel (pondéré)</td>
                <td>{formatFc(kpis.pipelineWeighted)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <div className="row g-3" style={{ marginBottom: 16 }}>
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <h3>Conversion</h3>
            <p className="card-sub">Entonnoir des prospects créés ce mois.</p>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Étape</th>
                    <th>Volume</th>
                    <th>Du total</th>
                    <th>De l’étape préc.</th>
                  </tr>
                </thead>
                <tbody>
                  {report.funnel.map((step) => (
                    <tr key={step.label}>
                      <td>
                        {step.label}
                        <div className="funnel-bar">
                          <span style={{ width: `${Math.min(100, step.rate)}%` }} />
                        </div>
                      </td>
                      <td>{step.value}</td>
                      <td>{formatRate(step.rate)}</td>
                      <td>{formatRate(step.stepRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <h3>Sources</h3>
            <p className="card-sub">Quelle source génère des prospects et des clients ce mois.</p>
            {report.sources.length === 0 ? (
              <p className="empty-copy">Aucun prospect créé sur cette période.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Prospects</th>
                      <th>Clients</th>
                      <th>Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sources.map((source) => (
                      <tr key={source.name}>
                        <td>{source.name}</td>
                        <td>{source.prospects}</td>
                        <td>{source.clients}</td>
                        <td>{formatRate(source.conversion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </div>

      <div className="row g-3" style={{ marginBottom: 16 }}>
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <h3>Pipeline</h3>
            <p className="card-sub">Répartition actuelle des affaires ouvertes.</p>
            {report.byStage.length === 0 ? (
              <p className="empty-copy">Aucun pipeline par défaut.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Étape</th>
                      <th>Affaires</th>
                      <th>Montant</th>
                      <th>Pondéré</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byStage.map((stage: Row) => (
                      <tr key={stage.id}>
                        <td>
                          <span className={`status-pill ${stagePillClass(stage)}`}>{stage.name}</span>
                        </td>
                        <td>{stage.count}</td>
                        <td>{formatFc(stage.total)}</td>
                        <td>{formatFc(stage.weighted)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <h3>Statuts prospects</h3>
            <p className="card-sub">Stock actuel, toutes périodes.</p>
            <div className="table-wrap">
              <table className="data-table">
                <tbody>
                  {report.statusSnapshot.map((status) => (
                    <tr key={status.slug}>
                      <td>
                        <span className={`status-pill ${statusPillClass(status.slug, status.isConverted, status.isLost)}`}>
                          {status.name}
                        </span>
                      </td>
                      <td>{status.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>

      <article className="dash-card">
        <h3>Commerciaux</h3>
        <p className="card-sub">Prospects du mois, affaires gagnées, conversion.</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Commercial</th>
                <th>Prospects</th>
                <th>RDV</th>
                <th>Opportunités</th>
                <th>Gagnés</th>
                <th>Conversion</th>
                <th>CA gagné</th>
              </tr>
            </thead>
            <tbody>
              {report.team.reps.map((rep) => (
                <tr key={rep.id}>
                  <td>
                    <strong>{rep.name}</strong>
                    <div className="muted-line">{rep.teamName ?? "Sans équipe"}</div>
                  </td>
                  <td>{rep.prospects}</td>
                  <td>{rep.meetings}</td>
                  <td>{rep.opportunities}</td>
                  <td>{rep.wonDeals}</td>
                  <td>{formatRate(conversionPercent(rep.wonDeals, rep.prospects))}</td>
                  <td>{formatFc(rep.wonRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </Shell>
  );
}
