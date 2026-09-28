import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { orgScope } from "@/lib/auth";
import {
  PIPELINE_GOAL,
  DASHBOARD_KPI_DETAIL_LIMIT,
  allProspectsKpi,
  dashboardKpiDetailTitle,
  dormantProspectsKpi,
  followUpProspectsKpi,
  parseDashboardKpiId,
  type DashboardKpi,
  type DashboardKpiDetailRow,
  type DashboardKpiDetails,
} from "@/lib/dashboard-logic";
import {
  actionAnchor,
  dormantWhere,
  notArchivedWhere,
  relanceWhere,
  DASHBOARD_DORMANT_MONTHS,
  SAFECHECK_STATUSES,
} from "@/lib/safecheck";
import { formatShortDate, toDateInput } from "@/lib/prospect-list-logic";
import { isSalesRole } from "@/lib/roles";
import {
  buildAnalyticsSeries,
  conversionPercent,
  last12MonthWinRates,
  monthBounds,
  monthWinRate,
  type AnalyticsRange,
} from "@/lib/report-logic";

export type { DashboardKpi, DashboardKpiDetailRow, DashboardKpiDetails };

export type DashboardStats = {
  overdue: number;
  pipelineGoal: number;
  pipelinePercent: number;
  winPercent: number;
  pipelineMix: { open: number; won: number; lost: number };
  prospectKpis: DashboardKpi[];
  taskKpis: DashboardKpi[];
  statusBars: { label: string; value: number }[];
  barTitle: string;
  barSubtitle: string;
  monthlyWinRates: { label: string; value: number }[];
  dormantBars: { label: string; value: number }[];
  overdueTaskBars: { label: string; value: number }[];
  analytics: Record<AnalyticsRange, { total: number; spark: number[]; caption: string }>;
  prospectsHref: string;
  teamProspects?: DashboardKpiDetailRow[];
};

function ownedBy(session: SessionPayload) {
  return isSalesRole(session.role) ? { ownerId: session.userId } : {};
}

function activityBy(session: SessionPayload) {
  return isSalesRole(session.role) ? { userId: session.userId } : {};
}

function visibleProspectsWhere(session: SessionPayload, now: Date) {
  return { ...orgScope(session), ...ownedBy(session), ...notArchivedWhere(now) };
}

function dashboardKpiWhere(session: SessionPayload, kpiId: string, now = new Date()) {
  const parsed = parseDashboardKpiId(kpiId);
  if (!parsed) return null;
  if (parsed.type === "mine") {
    return { ...orgScope(session), ownerId: session.userId, ...notArchivedWhere(now) };
  }
  if (parsed.type === "all") {
    return visibleProspectsWhere(session, now);
  }
  const visible = visibleProspectsWhere(session, now);
  if (parsed.type === "dormant") return { ...visible, ...dormantWhere(now, DASHBOARD_DORMANT_MONTHS) };
  if (parsed.type === "relance") return { ...visible, ...relanceWhere(now) };
  return { ...visible, statusId: parsed.statusId };
}

export async function listDashboardKpiDetails(session: SessionPayload, kpiId: string): Promise<DashboardKpiDetails> {
  const where = dashboardKpiWhere(session, kpiId);
  if (!where) return { items: [], truncated: false };

  const rows = await prisma.prospect.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayCode: true,
      notes: true,
      statusComment: true,
      statusId: true,
      ownerId: true,
      lastActionAt: true,
      firstContactAt: true,
      lastContactAt: true,
      nextContactAt: true,
      createdAt: true,
      company: { select: { name: true, displayCode: true } },
      status: { select: { name: true, slug: true, isConverted: true, isLost: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: DASHBOARD_KPI_DETAIL_LIMIT + 1,
  });
  const truncated = rows.length > DASHBOARD_KPI_DETAIL_LIMIT;
  const items = rows.slice(0, DASHBOARD_KPI_DETAIL_LIMIT).map((row) => ({
    id: row.id,
    href: `/prospects/${row.id}`,
    title: dashboardKpiDetailTitle(row.company?.name, row.firstName, row.lastName),
    status: row.status.name,
    statusSlug: row.status.slug,
    isConverted: row.status.isConverted,
    isLost: row.status.isLost,
    statusId: row.statusId,
    ownerId: row.ownerId ?? row.owner?.id ?? "",
    owner: row.owner?.name ?? "Non assigné",
    lastAction: formatShortDate(actionAnchor(row)),
    action: row.statusComment ?? row.notes ?? "",
    meetingAt: toDateInput(row.nextContactAt),
    code: row.displayCode ?? row.company?.displayCode ?? "",
  }));
  return { items, truncated };
}

export async function getDashboardStats(session: SessionPayload): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { end: monthEnd } = monthBounds(now.getFullYear(), now.getMonth());
  const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const scope = { ...orgScope(session), ...ownedBy(session) };
  const visible = { ...scope, ...notArchivedWhere(now) };

  const [
    statuses,
    groupedStatuses,
    dormantRows,
    overdueTasks,
    overdueByOwner,
    openTasks,
    doneTasks,
    cancelledTasks,
    urgentTasks,
    createdThisMonth,
    enteredPipelineThisMonth,
    closedDeals,
    activityDates,
    ownerRows,
    myActiveProspects,
    inactiveTwoMonths,
    toFollowUp,
  ] = await Promise.all([
    prisma.prospectStatus.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, isConverted: true, isLost: true },
    }),
    prisma.prospect.groupBy({
      by: ["statusId"],
      where: visible,
      _count: { _all: true },
    }),
    prisma.prospect.groupBy({
      by: ["ownerId"],
      where: { ...visible, ...dormantWhere(now) },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] }, dueAt: { lt: now } },
    }),
    prisma.task.groupBy({
      by: ["ownerId"],
      where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] }, dueAt: { lt: now } },
      _count: { _all: true },
    }),
    prisma.task.count({ where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { ...scope, status: "DONE" } }),
    prisma.task.count({ where: { ...scope, status: "CANCELLED" } }),
    prisma.task.count({
      where: { ...scope, status: { in: ["TODO", "IN_PROGRESS"] }, priority: { in: ["HIGH", "URGENT"] } },
    }),
    prisma.prospect.count({ where: { ...visible, createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.prospect.count({
      where: {
        ...visible,
        createdAt: { gte: monthStart, lte: monthEnd },
        status: { slug: "pipeline" },
      },
    }),
    prisma.opportunity.findMany({
      where: { ...scope, status: { in: ["WON", "LOST"] }, updatedAt: { gte: yearAgo } },
      select: { status: true, updatedAt: true },
    }),
    prisma.activity.findMany({
      where: { ...orgScope(session), ...activityBy(session) },
      select: { occurredAt: true },
    }),
    prisma.prospect.groupBy({
      by: ["ownerId"],
      where: visible,
      _count: { _all: true },
    }),
    prisma.prospect.count({
      where:
        isSalesRole(session.role)
          ? { ...orgScope(session), ownerId: session.userId, ...notArchivedWhere(now) }
          : visible,
    }),
    prisma.prospect.count({
      where: { ...visible, ...dormantWhere(now, DASHBOARD_DORMANT_MONTHS) },
    }),
    prisma.prospect.count({
      where: { ...visible, ...relanceWhere(now) },
    }),
  ]);

  const counts = new Map(groupedStatuses.map((item) => [item.statusId, item._count._all]));
  const ordered = SAFECHECK_STATUSES.map((spec) => statuses.find((item) => item.slug === spec.slug)).filter(
    (item): item is (typeof statuses)[number] => Boolean(item),
  );
  const statusBars = ordered.map((status) => ({
    label: status.name,
    value: counts.get(status.id) ?? 0,
  }));

  const ownerIds = [...new Set([...ownerRows, ...dormantRows, ...overdueByOwner].map((row) => row.ownerId).filter(Boolean))] as string[];
  const owners = ownerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true },
      })
    : [];
  const ownerName = new Map(owners.map((item) => [item.id, item.name]));

  const byCommercial =
    isSalesRole(session.role)
      ? statusBars
      : ownerRows.map((row) => ({
          label: row.ownerId ? (ownerName.get(row.ownerId) ?? "Non assigné") : "Non assigné",
          value: row._count._all,
        }));

  const dormantBars = dormantRows.map((row) => ({
    label: row.ownerId ? (ownerName.get(row.ownerId) ?? "Non assigné") : "Non assigné",
    value: row._count._all,
  }));
  const overdueTaskBars = overdueByOwner.map((row) => ({
    label: ownerName.get(row.ownerId) ?? "Non assigné",
    value: row._count._all,
  }));
  const dormantTotal = dormantRows.reduce((sum, row) => sum + row._count._all, 0);
  const rejected = ordered.find((item) => item.slug === "rejete");
  const finalized = ordered.find((item) => item.slug === "finalise");
  const pipeline = ordered.find((item) => item.slug === "pipeline");
  const closed = closedDeals.map((item) => ({ date: item.updatedAt, won: item.status === "WON" }));
  const isSales = isSalesRole(session.role);
  const prospectsHref = isSales ? "/prospects" : "/direction/prospects";

  const tones: DashboardKpi["tone"][] = ["blue", "red", "green"];
  const statusKpis = ordered
    .filter((status) => status.slug !== "opportunite" && status.slug !== "lead")
    .map((status, index) => ({
      id: `status:${status.id}`,
      label: status.name,
      hint: "Hors archives 15 j / 30 j",
      value: counts.get(status.id) ?? 0,
      tone: tones[index] ?? "navy",
      href: `${prospectsHref}?status=${status.id}`,
    }));
  const prospectKpis: DashboardKpi[] = [
    allProspectsKpi(myActiveProspects, isSales ? { scope: "mine" } : { scope: "all", href: prospectsHref }),
    dormantProspectsKpi(inactiveTwoMonths, isSales ? "/prospects?mine=1" : prospectsHref),
    followUpProspectsKpi(toFollowUp, isSales ? "/prospects?mine=1" : prospectsHref),
    ...statusKpis,
  ];

  return {
    overdue: overdueTasks,
    pipelineGoal: PIPELINE_GOAL,
    pipelinePercent: Math.round(conversionPercent(enteredPipelineThisMonth, createdThisMonth)),
    winPercent: Math.round(monthWinRate(closed, now)),
    pipelineMix: {
      open: pipeline ? (counts.get(pipeline.id) ?? 0) : 0,
      won: finalized ? (counts.get(finalized.id) ?? 0) : 0,
      lost: rejected ? (counts.get(rejected.id) ?? 0) : 0,
    },
    prospectKpis,
    taskKpis: [
      {
        label: "Tâches ouvertes",
        hint: "À faire et en cours",
        value: openTasks,
        tone: "orange",
        href: "/taches",
      },
      {
        label: "Fait",
        hint: "Tâches clôturées",
        value: doneTasks,
        tone: "green",
        href: "/taches?status=DONE",
      },
      {
        label: "Clôturé incomplet",
        hint: "Sans aboutissement",
        value: cancelledTasks,
        tone: "blue",
        href: "/taches?status=CANCELLED",
      },
      {
        label: "Urgent",
        hint: "Haute priorité",
        value: urgentTasks,
        tone: "urgent",
        href: "/taches",
      },
      {
        label: "Tâches en retard",
        hint: isSales ? "Mes échéances dépassées" : "Tous commerciaux",
        value: overdueTasks,
        tone: "red",
        href: "/taches",
      },
      {
        label: "Prospects dormants",
        hint: "6 mois sans progression",
        value: dormantTotal,
        tone: "navy",
        href: isSales ? "/interface" : prospectsHref,
      },
    ],
    statusBars: byCommercial.length ? byCommercial : statusBars,
    barTitle: isSales ? "Prospect" : "Par commercial",
    barSubtitle: isSales
      ? "Répartition de mes entreprises par statut"
      : "Répartition des prospects par commercial (hors archives)",
    monthlyWinRates: last12MonthWinRates(closed, now),
    dormantBars,
    overdueTaskBars,
    analytics: buildAnalyticsSeries(
      activityDates.map((item) => item.occurredAt),
      now,
    ),
    prospectsHref,
    teamProspects: isSales ? undefined : (await listDashboardKpiDetails(session, "all")).items,
  };
}
