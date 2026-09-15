import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { weightedAmount } from "@/lib/pipeline-logic";
import {
  conversionPercent,
  funnelFromProspects,
  monthBounds,
  sourceReport,
  type ReportProspect,
} from "@/lib/report-logic";
import { getTeamPerformance } from "@/lib/team";
import type { SessionPayload } from "@/lib/session";

export async function getReports(session: SessionPayload, year: number, monthIndex: number) {
  const { start, end } = monthBounds(year, monthIndex);
  const scope = orgScope(session);

  const [prospects, statusRows, activities, wonOps, lostOps, openDeals, stages] = await Promise.all([
    prisma.prospect.findMany({
      where: { ...scope, createdAt: { gte: start, lte: end } },
      include: {
        status: true,
        source: { select: { name: true } },
        opportunities: { select: { status: true } },
      },
    }),
    prisma.prospect.groupBy({
      by: ["statusId"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.activity.count({
      where: { ...scope, occurredAt: { gte: start, lte: end } },
    }),
    prisma.opportunity.findMany({
      where: { ...scope, status: "WON", updatedAt: { gte: start, lte: end } },
      select: { amount: true },
    }),
    prisma.opportunity.count({
      where: { ...scope, status: "LOST", updatedAt: { gte: start, lte: end } },
    }),
    prisma.opportunity.findMany({
      where: { ...scope, status: "OPEN" },
      select: { amount: true, probability: true, stageId: true },
    }),
    prisma.pipeline.findFirst({
      where: { ...scope, isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const rows: ReportProspect[] = prospects.map((item) => ({
    statusSlug: item.status.slug,
    isConverted: item.status.isConverted || Boolean(item.convertedAt),
    lastContactAt: item.lastContactAt,
    sourceName: item.source?.name ?? null,
    opportunityCount: item.opportunities.length,
    wonOpportunity: item.opportunities.some((opp) => opp.status === "WON"),
  }));

  const contacted = prospects.filter((item) => item.lastContactAt).length;
  const qualified = rows.filter((row) => row.statusSlug === "pipeline" || row.isConverted).length;
  const converted = prospects.filter((item) => item.convertedAt).length;
  const lostProspects = prospects.filter((item) => item.status.isLost).length;
  const wonRevenue = wonOps.reduce((sum, item) => sum + item.amount, 0);
  const pipelineValue = openDeals.reduce((sum, item) => sum + item.amount, 0);
  const pipelineWeighted = openDeals.reduce(
    (sum, item) => sum + weightedAmount(item.amount, item.probability),
    0,
  );
  const closedDeals = wonOps.length + lostOps;

  const statuses = await prisma.prospectStatus.findMany({
    where: scope,
    orderBy: { sortOrder: "asc" },
  });
  const countByStatus = new Map(statusRows.map((row) => [row.statusId, row._count._all]));
  const statusSnapshot = statuses.map((status) => ({
    name: status.name,
    slug: status.slug,
    count: countByStatus.get(status.id) ?? 0,
    isConverted: status.isConverted,
    isLost: status.isLost,
  }));

  const byStage =
    stages?.stages.map((stage) => {
      const items = openDeals.filter((deal) => deal.stageId === stage.id);
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      return {
        id: stage.id,
        name: stage.name,
        count: items.length,
        total,
        weighted: items.reduce((sum, item) => sum + weightedAmount(item.amount, item.probability), 0),
        isWon: stage.isWon,
        isLost: stage.isLost,
      };
    }) ?? [];

  const team = await getTeamPerformance(session, year, monthIndex);

  return {
    year,
    month: monthIndex + 1,
    kpis: {
      newProspects: prospects.length,
      contacted,
      qualified,
      converted,
      lostProspects,
      activities,
      openOps: openDeals.length,
      wonOps: wonOps.length,
      lostOps,
      wonRevenue,
      pipelineValue,
      pipelineWeighted,
      dealConversion: conversionPercent(wonOps.length, closedDeals),
    },
    funnel: funnelFromProspects(rows),
    sources: sourceReport(rows),
    statusSnapshot,
    byStage,
    team,
  };
}
