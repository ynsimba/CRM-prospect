import { requirePermission } from "@/lib/auth";
import { parseYearMonth } from "@/lib/activity-logic";
import { toCsv } from "@/lib/csv";
import { formatFc } from "@/lib/money";
import { conversionPercent } from "@/lib/report-logic";
import { PERMISSIONS } from "@/lib/permissions";
import { getReports } from "@/lib/reports";

export async function GET(request: Request) {
  const session = await requirePermission(PERMISSIONS.reportsRead);
  const url = new URL(request.url);
  const { year, monthIndex } = parseYearMonth(url.searchParams.get("month") ?? undefined);
  const report = await getReports(session, year, monthIndex);
  const monthLabel = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const rows: string[][] = [
    ["Section", "Libellé", "Valeur"],
    ["KPI", "Nouveaux prospects", String(report.kpis.newProspects)],
    ["KPI", "Contactés", String(report.kpis.contacted)],
    ["KPI", "Qualifiés", String(report.kpis.qualified)],
    ["KPI", "Convertis", String(report.kpis.converted)],
    ["KPI", "Affaires gagnées", String(report.kpis.wonOps)],
    ["KPI", "CA gagné", formatFc(report.kpis.wonRevenue)],
    ["KPI", "Pipeline", formatFc(report.kpis.pipelineValue)],
    ["KPI", "Conversion affaires", `${report.kpis.dealConversion} %`],
    ...report.funnel.map((step) => ["Entonnoir", step.label, String(step.value)]),
    ...report.sources.map((source) => [
      "Source",
      source.name,
      `${source.prospects} prospects / ${source.clients} clients / ${source.conversion} %`,
    ]),
    ...report.team.reps.map((rep) => [
      "Commercial",
      rep.name,
      `${rep.prospects} prospects / ${rep.wonDeals} gagnés / ${conversionPercent(rep.wonDeals, rep.prospects)} %`,
    ]),
  ];

  return new Response(toCsv(["Section", "Libellé", "Valeur"], rows.slice(1)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rapport-${monthLabel}.csv"`,
    },
  });
}
