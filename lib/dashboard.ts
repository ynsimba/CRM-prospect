import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { orgScope } from "@/lib/auth";
import { startOfDay } from "@/lib/activity-logic";
import { PIPELINE_GOAL, dormantWhere } from "@/lib/dashboard-logic";
import { conversionPercent, last12MonthWinRates, monthBounds } from "@/lib/report-logic";

export type DashboardKpi = {
  label: string;
  hint: string;
  value: number;
  tone: "orange" | "navy" | "blue" | "green" | "red" | "urgent";
  href: string;
  suffix?: string;
};

export type DashboardStats = {
  overdue: number;
  pipelineGoal: number;
  prospectKpis: DashboardKpi[];
  taskKpis: DashboardKpi[];
  statusBars: { label: string; value: number }[];
  pipelinePercent: number;
  monthlyWinRates: { label: string; value: number }[];
};

function ownedBy(session: SessionPayload) {
  return session.role === "SALES" ? { ownerId: session.userId } : {};
}

export async function getDashboardStats(session: SessionPayload): Promise<DashboardStats> {
  const now = new Date();
  const today = startOfDay(now);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const { end: monthEnd } = monthBounds(today.getFullYear(), today.getMonth());
  const yearAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const scope = { ...orgScope(session), ...ownedBy(session) };
  const active = { status: { isConverted: false, isLost: false } };

  const [
    activeProspects,
    dormantProspects,
    rejectedProspects,
    toFollowUp,
    finalized,
    openPipeline,
    openTasks,
    doneTasks,
    cancelledTasks,
    urgentTasks,
    overdueTasks,
    createdThisMonth,
    enteredPipelineThisMonth,
    statuses,
    groupedStatuses,
    closedDeals,
  ] = await Promise.all([
    prisma.prospect.count({ where: { ...scope, ...active } }),
    prisma.prospect.count({ where: { ...scope, ...dormantWhere(now) } }),
    prisma.prospect.count({ where: { ...scope, status: { isLost: true } } }),
    prisma.prospect.count({
      where: { ...scope, ...active, nextContactAt: { lt: today } },
    }),
    prisma.prospect.count({ where: { ...scope, status: { isConverted: true } } }),
    prisma.opportunity.count({ where: { ...scope, status: "OPEN" } }),
    prisma.task.count({ where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { ...scope, status: "DONE" } }),
    prisma.task.count({ where: { ...scope, status: "CANCELLED" } }),
    prisma.task.count({
      where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] }, priority: { in: ["HIGH", "URGENT"] } },
    }),
    prisma.task.count({
      where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] }, dueAt: { lt: today } },
    }),
    prisma.prospect.count({ where: { ...scope, createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.prospect.count({
      where: {
        ...scope,
        createdAt: { gte: monthStart, lte: monthEnd },
        opportunities: { some: {} },
      },
    }),
    prisma.prospectStatus.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.prospect.groupBy({
      by: ["statusId"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.opportunity.findMany({
      where: {
        ...scope,
        status: { in: ["WON", "LOST"] },
        updatedAt: { gte: yearAgo },
      },
      select: { status: true, updatedAt: true },
    }),
  ]);

  const counts = new Map(groupedStatuses.map((item) => [item.statusId, item._count._all]));

  return {
    overdue: toFollowUp,
    pipelineGoal: PIPELINE_GOAL,
    prospectKpis: [
      {
        label: "Tous les prospects",
        hint: "Ensemble de mes prospects actifs",
        value: activeProspects,
        tone: "orange",
        href: "/prospects",
      },
      {
        label: "Prospects dormants",
        hint: "Sans activité depuis 2 mois",
        value: dormantProspects,
        tone: "navy",
        href: "/suivi",
      },
      {
        label: "Prospects rejetés",
        hint: "Ayant rejeté mon approche",
        value: rejectedProspects,
        tone: "blue",
        href: "/archives",
      },
      {
        label: "À relancer",
        hint: "Prospects à relancer",
        value: toFollowUp,
        tone: "orange",
        href: "/suivi",
      },
      {
        label: "Finalisé",
        hint: "Ayant accepté la collaboration",
        value: finalized,
        tone: "navy",
        href: "/archives",
      },
      {
        label: "Pipeline",
        hint: "Affaires ouvertes",
        value: openPipeline,
        tone: "blue",
        href: "/pipeline",
      },
    ],
    taskKpis: [
      {
        label: "Tâches ouvertes",
        hint: "Toutes les tâches actives",
        value: openTasks,
        tone: "orange",
        href: "/taches",
      },
      {
        label: "Clôture complète",
        hint: "Tâches clôturées avec succès",
        value: doneTasks,
        tone: "green",
        href: "/taches?status=DONE",
      },
      {
        label: "Clôture incomplète",
        hint: "Tâches clôturées sans succès",
        value: cancelledTasks,
        tone: "blue",
        href: "/taches?status=CANCELLED",
      },
      {
        label: "Urgent",
        hint: "Tâches de haute priorité",
        value: urgentTasks,
        tone: "urgent",
        href: "/taches",
      },
      {
        label: "Tâches en retard",
        hint: "Échéance dépassée",
        value: overdueTasks,
        tone: "red",
        href: "/taches",
      },
    ],
    statusBars: statuses.map((status) => ({
      label: status.name,
      value: counts.get(status.id) ?? 0,
    })),
    pipelinePercent: Math.round(conversionPercent(enteredPipelineThisMonth, createdThisMonth)),
    monthlyWinRates: last12MonthWinRates(
      closedDeals.map((item) => ({ date: item.updatedAt, won: item.status === "WON" })),
      today,
    ),
  };
}
