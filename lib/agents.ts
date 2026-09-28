import "server-only";

import bcrypt from "bcryptjs";
import { cache } from "react";
import { redirect } from "next/navigation";
import { orgScope, requireSession } from "@/lib/auth";
import { agentDeletionBlocker } from "@/lib/agent-logic";
import {
  averageDays,
  emptyTargets,
  GOAL_METRICS,
  goalProgress,
  inRange,
  isInPortfolio,
  isOpenProspect,
  isOpenTask,
  isUntreated,
  meetingsToday,
  monthBuckets,
  nextMatricule,
  overdueFollowUps,
  parseAgentStatus,
  parseAssignmentMode,
  periodRange,
  planDistribution,
  presence,
  rate,
  staleProspects,
  unansweredProposals,
  upcomingMeetings,
  weekBuckets,
  type AgendaTask,
  type Candidate,
  type GoalTargets,
  type PeriodKey,
  type PortfolioProspect,
} from "@/lib/agent-cockpit-logic";
import type { AgentStatus, AssignmentMode, Role, TaskType } from "@/lib/enums";
import { prisma, type Row } from "@/lib/prisma";
import { AGENT_ROLES, canManageAgents, isDirectionRole } from "@/lib/roles";
import type { SessionPayload } from "@/lib/session";
import { isStaffEmail, normalizeStaffEmail, staffEmailMessage } from "@/lib/staff-email";

/* ================================================================== access */

export type AgentScope = {
  session: SessionPayload;
  /** Team lead: restricted to one team. Direction: null (whole organization). */
  teamId: string | null;
  isTeamLead: boolean;
  /** Direction/Admin only: create, edit, delete agents and change configuration. */
  canAdminister: boolean;
};

/** Opens the cockpit to Direction (whole organization) and team leads (their team only). */
export const requireAgentScope = cache(async (): Promise<AgentScope> => {
  const session = await requireSession();
  if (!canManageAgents(session.role)) redirect("/");
  if (isDirectionRole(session.role)) {
    return { session, teamId: null, isTeamLead: false, canAdminister: true };
  }
  const me = await prisma.user.findFirst({
    where: { id: session.userId, ...orgScope(session) },
    select: { teamId: true },
  });
  return { session, teamId: (me?.teamId as string | null) ?? null, isTeamLead: true, canAdminister: false };
});

export async function requireAgentAdmin() {
  const scope = await requireAgentScope();
  if (!scope.canAdminister) redirect("/direction/agents/liste");
  return scope;
}

function agentWhere(scope: AgentScope) {
  const base = { ...orgScope(scope.session), role: { in: AGENT_ROLES } };
  if (!scope.isTeamLead) return base;
  // A team lead without a team only sees themself.
  return scope.teamId ? { ...base, teamId: scope.teamId } : { ...base, id: scope.session.userId };
}

/* ================================================================== agents */

export type AgentRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  civility: string | null;
  role: Role;
  matricule: string | null;
  jobTitle: string | null;
  hiredAt: Date | null;
  status: AgentStatus;
  isActive: boolean;
  photoUrl: string | null;
  lastLoginAt: Date | null;
  lastSeenAt: Date | null;
  teamId: string | null;
  zoneId: string | null;
  supervisorId: string | null;
  team: { id: string; name: string } | null;
  zone: { id: string; name: string } | null;
  supervisor: { id: string; name: string } | null;
};

function toAgent(row: Row): AgentRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    civility: row.civility ?? null,
    role: row.role,
    matricule: row.matricule ?? null,
    jobTitle: row.jobTitle ?? null,
    hiredAt: row.hiredAt ?? null,
    status: parseAgentStatus(row.status),
    isActive: Boolean(row.isActive),
    photoUrl: row.photoUrl ?? null,
    lastLoginAt: row.lastLoginAt ?? null,
    lastSeenAt: row.lastSeenAt ?? null,
    teamId: row.teamId ?? null,
    zoneId: row.zoneId ?? null,
    supervisorId: row.supervisorId ?? null,
    team: row.team ?? null,
    zone: row.zone ?? null,
    supervisor: row.supervisor ?? null,
  };
}

const AGENT_INCLUDE = {
  team: { select: { id: true, name: true } },
  zone: { select: { id: true, name: true } },
  supervisor: { select: { id: true, name: true } },
};

export async function loadAgents(scope: AgentScope) {
  const rows = await prisma.user.findMany({
    where: agentWhere(scope),
    include: AGENT_INCLUDE,
    orderBy: { name: "asc" },
  });
  return rows.map(toAgent);
}

export async function getAgent(scope: AgentScope, id: string) {
  if (!id) return null;
  const row = await prisma.user.findFirst({ where: { ...agentWhere(scope), id }, include: AGENT_INCLUDE });
  return row ? toAgent(row) : null;
}

async function requireAgent(scope: AgentScope, id: string) {
  const agent = await getAgent(scope, id);
  if (!agent) throw new Error("Agent commercial introuvable.");
  return agent;
}

/* ================================================================== dataset */

type OpportunityRow = {
  id: string;
  name: string;
  ownerId: string | null;
  prospectId: string | null;
  status: string;
  amount: number;
  stageId: string;
  stageName: string;
  createdAt: Date;
  updatedAt: Date;
};

type ActivityRow = {
  id: string;
  userId: string;
  type: string;
  occurredAt: Date;
  prospectId: string | null;
  comment: string | null;
  outcome: string | null;
  prospectLabel: string | null;
};

type TaskRow = AgendaTask & {
  title: string;
  prospectId: string | null;
  prospectLabel: string | null;
  updatedAt: Date;
};

export type ProspectRow = PortfolioProspect & {
  firstName: string;
  lastName: string;
  displayCode: string | null;
  priority: string;
  city: string | null;
  address: string | null;
  company: { id: string; name: string } | null;
  statusName: string;
};

type StatusChangeRow = { prospectId: string; statusSlug: string; statusName: string; actorId: string | null; occurredAt: Date };

function prospectLabel(row: { firstName?: string; lastName?: string; company?: { name: string } | null } | null) {
  if (!row) return null;
  if (row.company?.name) return row.company.name;
  return [row.firstName, row.lastName && row.lastName !== "—" ? row.lastName : ""].filter(Boolean).join(" ") || null;
}

const PROSPECT_SELECT = {
  id: true,
  ownerId: true,
  firstName: true,
  lastName: true,
  displayCode: true,
  priority: true,
  city: true,
  address: true,
  createdAt: true,
  firstContactAt: true,
  lastContactAt: true,
  lastActionAt: true,
  nextContactAt: true,
  convertedAt: true,
  company: { select: { id: true, name: true } },
  status: { select: { slug: true, name: true, isConverted: true, isLost: true } },
};

function toProspect(row: Row): ProspectRow {
  return {
    ...row,
    status: { slug: row.status.slug, isConverted: Boolean(row.status.isConverted), isLost: Boolean(row.status.isLost) },
    statusName: row.status.name,
    company: row.company ?? null,
  };
}

/** Everything the cockpit needs for a set of agents, loaded once and computed in memory. */
async function loadDataset(scope: AgentScope, agentIds: string[], range: { from: Date; to: Date }, now: Date) {
  if (agentIds.length === 0) {
    return { prospects: [], tasks: [], opportunities: [], activities: [], statusChanges: [], lastActivity: new Map<string, Date>() };
  }
  const org = orgScope(scope.session);
  const chartFrom = new Date(now);
  chartFrom.setDate(chartFrom.getDate() - 7 * 8);
  const activityFrom = chartFrom < range.from ? chartFrom : range.from;

  const [prospects, tasks, opportunities, activities, statusChanges, lastActivity] = await Promise.all([
    prisma.prospect.findMany({ where: { ...org, ownerId: { in: agentIds } }, select: PROSPECT_SELECT }),
    prisma.task.findMany({
      where: { ...org, ownerId: { in: agentIds } },
      select: {
        id: true,
        ownerId: true,
        type: true,
        status: true,
        dueAt: true,
        title: true,
        prospectId: true,
        updatedAt: true,
        prospect: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
      },
    }),
    prisma.opportunity.findMany({
      where: { ...org, ownerId: { in: agentIds } },
      select: {
        id: true,
        name: true,
        ownerId: true,
        prospectId: true,
        status: true,
        amount: true,
        stageId: true,
        createdAt: true,
        updatedAt: true,
        stage: { select: { name: true } },
      },
    }),
    prisma.activity.findMany({
      where: { ...org, userId: { in: agentIds }, occurredAt: { gte: activityFrom } },
      select: {
        id: true,
        userId: true,
        type: true,
        occurredAt: true,
        prospectId: true,
        comment: true,
        outcome: true,
        prospect: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
      },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.prospectStatusHistory.findMany({
      where: { ...org, occurredAt: { gte: range.from }, prospect: { ownerId: { in: agentIds } } },
      select: { prospectId: true, statusSlug: true, statusName: true, actorId: true, occurredAt: true },
    }),
    prisma.activity.groupBy({
      by: ["userId"],
      where: { ...org, userId: { in: agentIds } },
      _max: { occurredAt: true },
    }),
  ]);

  return {
    prospects: prospects.map(toProspect),
    tasks: tasks.map(
      (row: Row): TaskRow => ({
        id: row.id,
        ownerId: row.ownerId,
        type: (row.type ?? "TASK") as TaskType,
        status: row.status,
        dueAt: row.dueAt ?? null,
        title: row.title,
        prospectId: row.prospectId ?? null,
        prospectLabel: prospectLabel(row.prospect),
        updatedAt: row.updatedAt,
      }),
    ),
    opportunities: opportunities.map(
      (row: Row): OpportunityRow => ({ ...row, amount: Number(row.amount ?? 0), stageName: row.stage?.name ?? "" }),
    ),
    activities: activities.map(
      (row: Row): ActivityRow => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        occurredAt: row.occurredAt,
        prospectId: row.prospectId ?? null,
        comment: row.comment ?? null,
        outcome: row.outcome ?? null,
        prospectLabel: prospectLabel(row.prospect),
      }),
    ),
    statusChanges: statusChanges as StatusChangeRow[],
    lastActivity: new Map<string, Date>(
      lastActivity
        .filter((row: Row) => row._max?.occurredAt)
        .map((row: Row) => [String(row.userId), new Date(row._max.occurredAt)]),
    ),
  };
}

type Dataset = Awaited<ReturnType<typeof loadDataset>>;

/* ================================================================== metrics */

export type AgentMetrics = {
  portfolio: number;
  untreated: number;
  overdue: number;
  meetings: number;
  openOpportunities: number;
  conversions: number;
  pipelineValue: number;
  revenue: number;
  lastActivityAt: Date | null;
};

function isConversion(prospect: PortfolioProspect, range: { from: Date; to: Date }) {
  return prospect.status.isConverted && inRange(prospect.convertedAt, range);
}

function metricsFor(agentId: string, data: Dataset, range: { from: Date; to: Date }, now: Date): AgentMetrics {
  const prospects = data.prospects.filter((item) => item.ownerId === agentId && isInPortfolio(item, now));
  const tasks = data.tasks.filter((item) => item.ownerId === agentId);
  const opportunities = data.opportunities.filter((item) => item.ownerId === agentId);
  const open = opportunities.filter((item) => item.status === "OPEN");
  return {
    portfolio: prospects.length,
    untreated: prospects.filter(isUntreated).length,
    overdue: overdueFollowUps(tasks, prospects, now).count,
    meetings: upcomingMeetings(tasks, now).length,
    openOpportunities: open.length,
    conversions: data.prospects.filter((item) => item.ownerId === agentId && isConversion(item, range)).length,
    pipelineValue: open.reduce((sum, item) => sum + item.amount, 0),
    revenue: opportunities
      .filter((item) => item.status === "WON" && inRange(item.updatedAt, range))
      .reduce((sum, item) => sum + item.amount, 0),
    lastActivityAt: data.lastActivity.get(agentId) ?? null,
  };
}

export type AgentFilters = {
  q?: string;
  status?: AgentStatus | "";
  teamId?: string;
  zoneId?: string;
  period: PeriodKey;
};

export async function listAgentsWithMetrics(scope: AgentScope, filters: AgentFilters, now = new Date()) {
  const range = periodRange(filters.period, now);
  const agents = await loadAgents(scope);
  const q = filters.q?.trim().toLowerCase() ?? "";
  const visible = agents.filter(
    (agent) =>
      (!q || `${agent.name} ${agent.email} ${agent.matricule ?? ""}`.toLowerCase().includes(q)) &&
      (!filters.status || agent.status === filters.status) &&
      (!filters.teamId || agent.teamId === filters.teamId) &&
      (!filters.zoneId || agent.zoneId === filters.zoneId),
  );
  const data = await loadDataset(scope, visible.map((agent) => agent.id), range, now);
  return {
    range,
    rows: visible.map((agent) => ({ agent, metrics: metricsFor(agent.id, data, range, now), presence: presence(agent.lastSeenAt, now) })),
  };
}

export async function getOverview(scope: AgentScope, period: PeriodKey, now = new Date()) {
  const range = periodRange(period, now);
  const agents = await loadAgents(scope);
  const ids = agents.map((agent) => agent.id);
  const data = await loadDataset(scope, ids, range, now);
  const portfolio = data.prospects.filter((item) => isInPortfolio(item, now));
  const open = data.opportunities.filter((item) => item.status === "OPEN");
  const monthRange = periodRange("month", now);

  const statusCounts = new Map<string, number>();
  for (const prospect of portfolio) {
    statusCounts.set(prospect.statusName, (statusCounts.get(prospect.statusName) ?? 0) + 1);
  }

  const perAgent = agents.map((agent) => ({ agent, metrics: metricsFor(agent.id, data, range, now) }));

  return {
    range,
    kpis: {
      total: agents.length,
      active: agents.filter((agent) => agent.status === "ACTIVE").length,
      inactive: agents.filter((agent) => agent.status !== "ACTIVE").length,
      online: agents.filter((agent) => presence(agent.lastSeenAt, now) === "online").length,
      recent: agents.filter((agent) => presence(agent.lastSeenAt, now) !== null).length,
      assigned: portfolio.length,
      untreated: portfolio.filter(isUntreated).length,
      overdue: overdueFollowUps(data.tasks, portfolio, now).count,
      meetings: upcomingMeetings(data.tasks, now).length,
      openOpportunities: open.length,
      conversionsThisMonth: data.prospects.filter((item) => isConversion(item, monthRange)).length,
      pipelineValue: open.reduce((sum, item) => sum + item.amount, 0),
      revenue: data.opportunities
        .filter((item) => item.status === "WON" && inRange(item.updatedAt, range))
        .reduce((sum, item) => sum + item.amount, 0),
    },
    charts: {
      conversions: monthBuckets(
        data.prospects.filter((item) => item.status.isConverted && item.convertedAt).map((item) => item.convertedAt as Date),
        now,
      ),
      activity: weekBuckets(data.activities.map((item) => item.occurredAt), now),
      byStatus: [...statusCounts.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value),
    },
    alerts: alertsFrom(data, now),
    topAgents: perAgent
      .filter((item) => item.agent.status === "ACTIVE")
      .sort((a, b) => b.metrics.conversions - a.metrics.conversions || b.metrics.pipelineValue - a.metrics.pipelineValue)
      .slice(0, 5),
  };
}

function alertsFrom(data: Dataset, now: Date) {
  const portfolio = data.prospects.filter((item) => isInPortfolio(item, now));
  return {
    overdue: overdueFollowUps(data.tasks, portfolio, now),
    stale: staleProspects(portfolio, now),
    proposals: unansweredProposals(data.opportunities, now),
    meetingsToday: meetingsToday(data.tasks, now),
  };
}

/* ================================================================== agent sheet */

export async function getAgentSheet(scope: AgentScope, id: string, period: PeriodKey, now = new Date()) {
  const agent = await getAgent(scope, id);
  if (!agent) return null;
  const range = periodRange(period, now);
  const data = await loadDataset(scope, [agent.id], range, now);
  return { agent, range, data, metrics: metricsFor(agent.id, data, range, now), alerts: alertsFrom(data, now) };
}

export type AgentSheet = NonNullable<Awaited<ReturnType<typeof getAgentSheet>>>;

const NEXT_ACTION_LABEL: Record<TaskType, string> = {
  CALL: "Appel",
  FOLLOW_UP: "Relance",
  MEETING: "RDV",
  VISIT: "Visite",
  REUNION: "Réunion",
  DEADLINE: "Échéance",
  TASK: "Tâche",
};

export function portfolioRows(sheet: AgentSheet, now = new Date()) {
  const valueByProspect = new Map<string, number>();
  for (const opp of sheet.data.opportunities) {
    if (opp.status === "OPEN" && opp.prospectId) {
      valueByProspect.set(opp.prospectId, (valueByProspect.get(opp.prospectId) ?? 0) + opp.amount);
    }
  }
  const nextTask = new Map<string, TaskRow>();
  for (const task of sheet.data.tasks as TaskRow[]) {
    if (!task.prospectId || !isOpenTask(task) || !task.dueAt) continue;
    const current = nextTask.get(task.prospectId);
    if (!current || (current.dueAt && task.dueAt < current.dueAt)) nextTask.set(task.prospectId, task);
  }
  return sheet.data.prospects
    .filter((item) => isInPortfolio(item, now))
    .map((prospect) => {
      const task = nextTask.get(prospect.id);
      let nextAction: { label: string; date: Date | null; overdue: boolean } | null = null;
      if (task?.dueAt) {
        nextAction = { label: NEXT_ACTION_LABEL[task.type], date: task.dueAt, overdue: task.dueAt < now };
      } else if (prospect.nextContactAt && isOpenProspect(prospect)) {
        nextAction = { label: "Relance", date: prospect.nextContactAt, overdue: prospect.nextContactAt < now };
      } else if (isUntreated(prospect)) {
        nextAction = { label: "Appeler", date: null, overdue: false };
      }
      return { prospect, value: valueByProspect.get(prospect.id) ?? 0, nextAction };
    })
    .sort((a, b) => {
      const at = a.nextAction?.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bt = b.nextAction?.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return at - bt;
    });
}

export type PipelineColumn = {
  id: string;
  name: string;
  isWon: boolean;
  isLost: boolean;
  count: number;
  value: number;
  items: { id: string; name: string; amount: number; ownerName: string; company: string | null; prospectId: string | null }[];
};

export async function agentPipeline(scope: AgentScope, ownerIds: string[]): Promise<{ columns: PipelineColumn[]; total: number }> {
  const pipeline = await prisma.pipeline.findFirst({
    where: { ...orgScope(scope.session), isDefault: true },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
  if (!pipeline || ownerIds.length === 0) return { columns: [], total: 0 };
  const opportunities = await prisma.opportunity.findMany({
    where: { ...orgScope(scope.session), pipelineId: pipeline.id, ownerId: { in: ownerIds } },
    select: {
      id: true,
      name: true,
      amount: true,
      stageId: true,
      ownerId: true,
      prospectId: true,
      owner: { select: { name: true } },
      company: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const columns: PipelineColumn[] = pipeline.stages.map((stage: Row) => {
    const items = opportunities.filter((item: Row) => item.stageId === stage.id);
    return {
      id: stage.id as string,
      name: stage.name as string,
      isWon: Boolean(stage.isWon),
      isLost: Boolean(stage.isLost),
      count: items.length,
      value: items.reduce((sum: number, item: Row) => sum + Number(item.amount ?? 0), 0),
      items: items.map((item: Row) => ({
        id: item.id as string,
        name: item.name as string,
        amount: Number(item.amount ?? 0),
        ownerName: (item.owner?.name as string | undefined) ?? "",
        company: (item.company?.name as string | undefined) ?? null,
        prospectId: (item.prospectId as string | null) ?? null,
      })),
    };
  });
  return { columns, total: opportunities.length };
}

/* ================================================================== performance */

export function performanceFor(agentId: string, data: Dataset, range: { from: Date; to: Date }) {
  const owned = data.prospects.filter((item) => item.ownerId === agentId);
  const received = owned.filter((item) => inRange(item.createdAt, range));
  const acts = data.activities.filter((item) => item.userId === agentId && inRange(item.occurredAt, range));
  const count = (type: string) => acts.filter((item) => item.type === type).length;
  const contacted = new Set(
    acts.filter((item) => item.prospectId && item.type !== "NOTE").map((item) => item.prospectId as string),
  );
  const ownedIds = new Set(owned.map((item) => item.id));
  const statusInRange = data.statusChanges.filter((item) => ownedIds.has(item.prospectId) && inRange(item.occurredAt, range));
  const qualified = new Set(statusInRange.filter((item) => item.statusSlug === "pipeline").map((item) => item.prospectId));
  const opps = data.opportunities.filter((item) => item.ownerId === agentId);
  const conversions = owned.filter((item) => isConversion(item, range));
  const followUps = data.tasks.filter(
    (item) => item.ownerId === agentId && item.type === "FOLLOW_UP" && item.status === "DONE" && inRange(item.updatedAt, range),
  ).length;

  const activity = {
    received: received.length,
    contacted: contacted.size,
    calls: count("CALL"),
    emails: count("EMAIL"),
    meetings: count("MEETING"),
    followUps,
    proposals: count("PROPOSAL"),
  };
  const results = {
    qualified: qualified.size,
    opportunities: opps.filter((item) => inRange(item.createdAt, range)).length,
    conversions: conversions.length,
    revenue: opps.filter((item) => item.status === "WON" && inRange(item.updatedAt, range)).reduce((s, i) => s + i.amount, 0),
    pipelineValue: opps.filter((item) => item.status === "OPEN").reduce((s, i) => s + i.amount, 0),
  };
  const ratios = {
    handling: rate(received.filter((item) => item.firstContactAt || item.lastContactAt).length, received.length),
    qualification: rate(results.qualified, activity.contacted),
    meeting: rate(activity.meetings, activity.contacted),
    conversion: rate(results.conversions, activity.received || owned.length),
    firstContactDays: averageDays(owned.map((item) => ({ from: item.createdAt, to: item.firstContactAt }))),
    cycleDays: averageDays(conversions.map((item) => ({ from: item.createdAt, to: item.convertedAt }))),
  };
  return { activity, results, ratios };
}

export type Performance = ReturnType<typeof performanceFor>;

/** Achieved figures compared with the goal metrics of the spec (§7). */
export function achievedForGoals(perf: Performance, portfolioUntreatedHandled: number) {
  return {
    prospects: portfolioUntreatedHandled,
    calls: perf.activity.calls,
    meetings: perf.activity.meetings,
    proposals: perf.activity.proposals,
    conversions: perf.results.conversions,
    revenue: perf.results.revenue,
  } satisfies Record<(typeof GOAL_METRICS)[number]["key"], number>;
}

export async function performanceTable(scope: AgentScope, period: PeriodKey, now = new Date()) {
  const range = periodRange(period, now);
  const agents = await loadAgents(scope);
  const data = await loadDataset(scope, agents.map((agent) => agent.id), range, now);
  return { range, rows: agents.map((agent) => ({ agent, perf: performanceFor(agent.id, data, range) })) };
}

/* ================================================================== goals */

function targetsFrom(row: Row | null): GoalTargets {
  const targets = emptyTargets();
  if (!row) return targets;
  for (const metric of GOAL_METRICS) targets[metric.target] = Number(row[metric.target] ?? 0);
  return targets;
}

export async function goalsForMonth(scope: AgentScope, year: number, month: number) {
  const rows = await prisma.goal.findMany({ where: { ...orgScope(scope.session), year, month } });
  const byUser = new Map<string, GoalTargets>();
  const byTeam = new Map<string, GoalTargets>();
  for (const row of rows) {
    if (row.userId) byUser.set(row.userId, targetsFrom(row));
    else if (row.teamId) byTeam.set(row.teamId, targetsFrom(row));
  }
  return { byUser, byTeam };
}

export async function goalProgressFor(scope: AgentScope, agentId: string, now = new Date()) {
  const month = { year: now.getFullYear(), month: now.getMonth() + 1 };
  const range = periodRange("month", now);
  const [{ byUser }, data] = await Promise.all([
    goalsForMonth(scope, month.year, month.month),
    loadDataset(scope, [agentId], range, now),
  ]);
  const perf = performanceFor(agentId, data, range);
  const handled = perf.activity.contacted;
  const achieved = achievedForGoals(perf, handled);
  const targets = byUser.get(agentId) ?? emptyTargets();
  return {
    ...month,
    targets,
    rows: GOAL_METRICS.map((metric) => ({ ...metric, ...goalProgress(achieved[metric.key], targets[metric.target]) })),
  };
}

export async function upsertGoalTargets(
  scope: AgentScope,
  owner: { userId: string } | { teamId: string },
  year: number,
  month: number,
  targets: GoalTargets,
) {
  if (month < 1 || month > 12) throw new Error("Mois invalide.");
  if ("userId" in owner) {
    await requireAgent(scope, owner.userId);
  } else {
    if (scope.isTeamLead && owner.teamId !== scope.teamId) throw new Error("Hors de votre équipe.");
    const team = await prisma.team.findFirst({ where: { id: owner.teamId, ...orgScope(scope.session) }, select: { id: true } });
    if (!team) throw new Error("Équipe introuvable.");
  }
  const where = {
    ...orgScope(scope.session),
    year,
    month,
    ...("userId" in owner ? { userId: owner.userId } : { userId: null, teamId: owner.teamId }),
  };
  const existing = await prisma.goal.findFirst({ where, select: { id: true } });
  if (existing) {
    return prisma.goal.update({ where: { id: existing.id }, data: targets });
  }
  return prisma.goal.create({
    data: {
      organizationId: scope.session.organizationId,
      year,
      month,
      userId: "userId" in owner ? owner.userId : null,
      teamId: "teamId" in owner ? owner.teamId : null,
      opportunitiesTarget: 0,
      ...targets,
    },
  });
}

/* ================================================================== agenda & journal */

export async function agendaFor(scope: AgentScope, agentIds: string[], days = 14, now = new Date()) {
  if (agentIds.length === 0) return [];
  const until = new Date(now);
  until.setDate(until.getDate() + days);
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [tasks, prospects] = await Promise.all([
    prisma.task.findMany({
      where: {
        ...orgScope(scope.session),
        ownerId: { in: agentIds },
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lte: until },
      },
      select: {
        id: true,
        title: true,
        type: true,
        dueAt: true,
        ownerId: true,
        prospectId: true,
        owner: { select: { name: true } },
        prospect: { select: { firstName: true, lastName: true, company: { select: { name: true } } } },
      },
      orderBy: { dueAt: "asc" },
    }),
    prisma.prospect.findMany({
      where: { ...orgScope(scope.session), ownerId: { in: agentIds }, nextContactAt: { gte: from, lte: until } },
      select: {
        id: true,
        nextContactAt: true,
        ownerId: true,
        firstName: true,
        lastName: true,
        owner: { select: { name: true } },
        company: { select: { name: true } },
        status: { select: { slug: true, isConverted: true, isLost: true } },
      },
    }),
  ]);
  const items = [
    ...tasks
      .filter((task: Row) => task.dueAt)
      .map((task: Row) => ({
        id: `t-${task.id}`,
        at: task.dueAt as Date,
        type: (task.type ?? "TASK") as TaskType,
        title: task.title as string,
        agentId: task.ownerId as string,
        agentName: (task.owner?.name as string) ?? "",
        prospectId: (task.prospectId as string | null) ?? null,
        prospectLabel: prospectLabel(task.prospect),
        overdue: (task.dueAt as Date) < from,
      })),
    ...prospects
      .filter((row: Row) => isOpenProspect({ ...row, status: row.status }))
      .map((row: Row) => ({
        id: `p-${row.id}`,
        at: row.nextContactAt as Date,
        type: "FOLLOW_UP" as TaskType,
        title: "Relance prévue",
        agentId: row.ownerId as string,
        agentName: (row.owner?.name as string) ?? "",
        prospectId: row.id as string,
        prospectLabel: prospectLabel(row),
        overdue: false,
      })),
  ];
  return items.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export type TimelineEvent = {
  id: string;
  at: Date;
  kind: "activity" | "status" | "assignment" | "opportunity";
  icon: string;
  text: string;
  actorName: string | null;
  prospectId: string | null;
};

const ACTIVITY_VERBS: Record<string, { icon: string; text: string }> = {
  CALL: { icon: "bi-telephone", text: "Appel effectué" },
  EMAIL: { icon: "bi-envelope", text: "E-mail envoyé" },
  WHATSAPP: { icon: "bi-whatsapp", text: "Message WhatsApp" },
  SMS: { icon: "bi-chat-dots", text: "SMS envoyé" },
  MEETING: { icon: "bi-people", text: "Rendez-vous" },
  VISIT: { icon: "bi-geo-alt", text: "Visite" },
  DEMO: { icon: "bi-display", text: "Démonstration" },
  PROPOSAL: { icon: "bi-file-earmark-text", text: "Proposition commerciale envoyée" },
  NOTE: { icon: "bi-journal-text", text: "Note ajoutée" },
  OTHER: { icon: "bi-dot", text: "Activité" },
};

/**
 * Read-only journal rebuilt from the agent's actions (§8) and every sensitive operation on their
 * portfolio (§12). Nothing here is editable: it is derived from append-only tables.
 */
export async function timeline(scope: AgentScope, agentIds: string[], options: { from?: Date; take?: number; portfolioWide?: boolean } = {}) {
  if (agentIds.length === 0) return [];
  const org = orgScope(scope.session);
  const take = options.take ?? 120;
  const since = options.from ? { gte: options.from } : undefined;
  const prospectFilter = options.portfolioWide ? { prospect: { ownerId: { in: agentIds } } } : { actorId: { in: agentIds } };
  const prospectSelect = { select: { firstName: true, lastName: true, displayCode: true, company: { select: { name: true } } } };

  const [activities, statuses, assignments, opportunities] = await Promise.all([
    prisma.activity.findMany({
      where: { ...org, userId: { in: agentIds }, ...(since ? { occurredAt: since } : {}) },
      select: { id: true, type: true, occurredAt: true, prospectId: true, outcome: true, user: { select: { name: true } }, prospect: prospectSelect },
      orderBy: { occurredAt: "desc" },
      take,
    }),
    prisma.prospectStatusHistory.findMany({
      where: { ...org, ...prospectFilter, ...(since ? { occurredAt: since } : {}) },
      select: { id: true, statusName: true, occurredAt: true, prospectId: true, actor: { select: { name: true } }, prospect: prospectSelect },
      orderBy: { occurredAt: "desc" },
      take,
    }),
    prisma.prospectAssignment.findMany({
      where: {
        ...org,
        OR: [{ toUserId: { in: agentIds } }, { fromUserId: { in: agentIds } }],
        ...(since ? { occurredAt: since } : {}),
      },
      select: {
        id: true,
        occurredAt: true,
        mode: true,
        prospectId: true,
        actor: { select: { name: true } },
        fromUser: { select: { name: true } },
        toUser: { select: { name: true } },
        prospect: prospectSelect,
      },
      orderBy: { occurredAt: "desc" },
      take,
    }),
    prisma.opportunity.findMany({
      where: { ...org, ownerId: { in: agentIds }, ...(since ? { updatedAt: since } : {}) },
      select: { id: true, name: true, status: true, createdAt: true, updatedAt: true, prospectId: true, owner: { select: { name: true } }, stage: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take,
    }),
  ]);

  const code = (row: Row) => (row?.displayCode ? `#${row.displayCode} ` : "");
  const events: TimelineEvent[] = [
    ...activities.map((row: Row) => {
      const verb = ACTIVITY_VERBS[row.type] ?? ACTIVITY_VERBS.OTHER;
      const target = prospectLabel(row.prospect);
      return {
        id: `a-${row.id}`,
        at: row.occurredAt,
        kind: "activity" as const,
        icon: verb.icon,
        text: `${verb.text}${target ? ` → ${target}` : ""}${row.outcome ? ` (${row.outcome})` : ""}`,
        actorName: row.user?.name ?? null,
        prospectId: row.prospectId ?? null,
      };
    }),
    ...statuses.map((row: Row) => ({
      id: `s-${row.id}`,
      at: row.occurredAt,
      kind: "status" as const,
      icon: "bi-arrow-right-circle",
      text: `Prospect ${code(row.prospect)}${prospectLabel(row.prospect) ?? ""} passé « ${row.statusName} »`,
      actorName: row.actor?.name ?? null,
      prospectId: row.prospectId ?? null,
    })),
    ...assignments.map((row: Row) => ({
      id: `r-${row.id}`,
      at: row.occurredAt,
      kind: "assignment" as const,
      icon: "bi-person-check",
      text: `Prospect ${code(row.prospect)}${prospectLabel(row.prospect) ?? ""} affecté à ${row.toUser?.name ?? "personne"}${
        row.fromUser?.name ? ` (précédemment ${row.fromUser.name})` : ""
      }${row.mode && row.mode !== "MANUAL" ? ` — ${row.mode === "ROUND_ROBIN" ? "Round Robin" : row.mode === "LOAD" ? "selon la charge" : row.mode === "ZONE" ? "selon la zone" : "réaffectation"}` : ""}`,
      actorName: row.actor?.name ?? null,
      prospectId: row.prospectId ?? null,
    })),
    ...opportunities.flatMap((row: Row) => {
      const out: TimelineEvent[] = [
        {
          id: `o-${row.id}`,
          at: row.createdAt,
          kind: "opportunity",
          icon: "bi-briefcase",
          text: `Opportunité créée : ${row.name}`,
          actorName: row.owner?.name ?? null,
          prospectId: row.prospectId ?? null,
        },
      ];
      if (row.status !== "OPEN") {
        out.push({
          id: `o2-${row.id}`,
          at: row.updatedAt,
          kind: "opportunity",
          icon: row.status === "WON" ? "bi-trophy" : "bi-x-circle",
          text: `${row.name} marquée « ${row.status === "WON" ? "Gagné" : "Perdu"} »`,
          actorName: row.owner?.name ?? null,
          prospectId: row.prospectId ?? null,
        });
      }
      return out;
    }),
  ];
  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, take);
}

/* ================================================================== assignment */

export async function getAssignmentRule(scope: AgentScope) {
  const row = await prisma.assignmentRule.findFirst({ where: orgScope(scope.session) });
  return { mode: parseAssignmentMode(row?.mode), lastAssignedUserId: (row?.lastAssignedUserId as string | null) ?? null };
}

export async function setAssignmentRule(scope: AgentScope, mode: AssignmentMode, lastAssignedUserId?: string | null) {
  const existing = await prisma.assignmentRule.findFirst({ where: orgScope(scope.session), select: { id: true } });
  const data = { mode, ...(lastAssignedUserId !== undefined ? { lastAssignedUserId } : {}) };
  if (existing) return prisma.assignmentRule.update({ where: { id: existing.id }, data });
  return prisma.assignmentRule.create({ data: { organizationId: scope.session.organizationId, ...data } });
}

/** Prospects nobody sells: no owner, or owned by someone outside the agent roles (e.g. created by Direction). */
export function unassignedWhere() {
  return { OR: [{ ownerId: null }, { owner: { role: { notIn: AGENT_ROLES } } }] };
}

export async function listAssignableProspects(
  scope: AgentScope,
  options: { ownerId?: string | "unassigned"; q?: string; take?: number } = {},
) {
  const org = orgScope(scope.session);
  const agents = await loadAgents(scope);
  const agentIds = agents.map((agent) => agent.id);
  let ownerFilter: Row;
  if (options.ownerId === "unassigned" || !options.ownerId) {
    ownerFilter = unassignedWhere();
  } else {
    if (!agentIds.includes(options.ownerId)) return [];
    ownerFilter = { ownerId: options.ownerId };
  }
  const q = options.q?.trim();
  const rows = await prisma.prospect.findMany({
    where: {
      ...org,
      ...ownerFilter,
      ...(q
        ? {
            AND: [
              {
                OR: [
                  { firstName: { contains: q } },
                  { lastName: { contains: q } },
                  { city: { contains: q } },
                  { displayCode: { contains: q } },
                  { company: { name: { contains: q } } },
                ],
              },
            ],
          }
        : {}),
    },
    select: { ...PROSPECT_SELECT, owner: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: options.take ?? 300,
  });
  return rows
    .map((row: Row) => ({ ...toProspect(row), ownerName: (row.owner?.name as string | undefined) ?? null }))
    .filter((row: ProspectRow) => isInPortfolio(row));
}

async function candidatesFor(scope: AgentScope) {
  const agents = (await loadAgents(scope)).filter((agent) => agent.status === "ACTIVE");
  if (agents.length === 0) return [];
  const loads = await prisma.prospect.findMany({
    where: { ...orgScope(scope.session), ownerId: { in: agents.map((agent) => agent.id) } },
    select: { id: true, ownerId: true, createdAt: true, firstContactAt: true, lastContactAt: true, lastActionAt: true, nextContactAt: true, convertedAt: true, status: { select: { slug: true, isConverted: true, isLost: true } } },
  });
  const active = new Map<string, number>();
  for (const row of loads as PortfolioProspect[]) {
    if (isOpenProspect(row) && isInPortfolio(row) && row.ownerId) active.set(row.ownerId, (active.get(row.ownerId) ?? 0) + 1);
  }
  return agents.map(
    (agent): Candidate => ({
      id: agent.id,
      name: agent.name,
      activeProspects: active.get(agent.id) ?? 0,
      teamId: agent.teamId,
      zoneId: agent.zoneId,
    }),
  );
}

export async function listZones(scope: AgentScope) {
  const rows = await prisma.zone.findMany({
    where: orgScope(scope.session),
    include: { team: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((row: Row) => ({
    id: row.id as string,
    name: row.name as string,
    matchTerms: (row.matchTerms as string) ?? "",
    teamId: (row.teamId as string | null) ?? null,
    team: (row.team as { id: string; name: string } | null) ?? null,
  }));
}

/**
 * Moves prospects to new owners and records who did it, from whom, to whom and when (§5).
 * Nothing else on the prospect changes, so its activities, tasks and status history follow it untouched.
 */
async function applyAssignments(
  scope: AgentScope,
  plan: { prospectId: string; agentId: string }[],
  mode: AssignmentMode | "REASSIGN",
  reason?: string,
) {
  const org = orgScope(scope.session);
  const prospects = await prisma.prospect.findMany({
    where: { ...org, id: { in: plan.map((item) => item.prospectId) } },
    select: { id: true, ownerId: true },
  });
  const previous = new Map(prospects.map((row: Row) => [row.id as string, (row.ownerId as string | null) ?? null]));
  let moved = 0;
  for (const item of plan) {
    if (!previous.has(item.prospectId)) continue;
    const from = previous.get(item.prospectId) ?? null;
    if (from === item.agentId) continue;
    await prisma.prospect.update({ where: { id: item.prospectId }, data: { ownerId: item.agentId } });
    await prisma.prospectAssignment.create({
      data: {
        organizationId: scope.session.organizationId,
        prospectId: item.prospectId,
        fromUserId: from,
        toUserId: item.agentId,
        actorId: scope.session.userId,
        mode,
        reason: reason?.slice(0, 250) || null,
      },
    });
    moved += 1;
  }
  return moved;
}

async function assertProspectsInScope(scope: AgentScope, prospectIds: string[]) {
  const ids = [...new Set(prospectIds.filter(Boolean))];
  if (ids.length === 0) throw new Error("Sélectionne au moins un prospect.");
  if (ids.length > 500) throw new Error("500 prospects maximum par opération.");
  const agentIds = (await loadAgents(scope)).map((agent) => agent.id);
  const rows = await prisma.prospect.findMany({
    where: { ...orgScope(scope.session), id: { in: ids } },
    select: { id: true, ownerId: true, city: true, address: true, owner: { select: { role: true } } },
  });
  if (rows.length !== ids.length) throw new Error("Certains prospects sont introuvables.");
  if (scope.isTeamLead) {
    // A team lead may only move prospects that are unassigned or already inside their team.
    const outside = rows.filter(
      (row: Row) => row.ownerId && AGENT_ROLES.includes(row.owner?.role) && !agentIds.includes(row.ownerId),
    );
    if (outside.length > 0) throw new Error("Certains prospects appartiennent à une autre équipe.");
  }
  return rows as { id: string; ownerId: string | null; city: string | null; address: string | null }[];
}

export async function assignProspects(
  scope: AgentScope,
  input: { prospectIds: string[]; agentId: string | "auto"; mode?: AssignmentMode; reason?: string; reassign?: boolean },
) {
  const rows = await assertProspectsInScope(scope, input.prospectIds);
  if (input.agentId === "auto") {
    const rule = await getAssignmentRule(scope);
    const mode = input.mode && input.mode !== "MANUAL" ? input.mode : rule.mode === "MANUAL" ? "LOAD" : rule.mode;
    const [candidates, zones] = await Promise.all([candidatesFor(scope), listZones(scope)]);
    if (candidates.length === 0) throw new Error("Aucun agent actif pour recevoir ces prospects.");
    const { plan, lastAssignedId } = planDistribution(mode, candidates, rows, {
      lastAssignedId: rule.lastAssignedUserId,
      zones,
    });
    const moved = await applyAssignments(scope, plan, mode, input.reason);
    if (mode === "ROUND_ROBIN") await setAssignmentRule(scope, rule.mode, lastAssignedId);
    const perAgent = plan.reduce<Record<string, number>>((acc, item) => {
      acc[item.agentId] = (acc[item.agentId] ?? 0) + 1;
      return acc;
    }, {});
    return { moved, mode, perAgent, agent: null as AgentRecord | null };
  }
  const agent = await requireAgent(scope, input.agentId);
  if (agent.status !== "ACTIVE") throw new Error(`${agent.name} n’est pas actif : impossible de lui affecter des prospects.`);
  const moved = await applyAssignments(
    scope,
    rows.map((row) => ({ prospectId: row.id, agentId: agent.id })),
    input.reassign ? "REASSIGN" : "MANUAL",
    input.reason,
  );
  return { moved, mode: "MANUAL" as AssignmentMode, perAgent: { [agent.id]: moved }, agent };
}

/** Called when a prospect is created without an owner: applies the organization's distribution rule. */
export async function autoAssignNewProspect(
  session: SessionPayload,
  prospect: { id: string; city?: string | null; address?: string | null },
) {
  const scope: AgentScope = { session, teamId: null, isTeamLead: false, canAdminister: true };
  const rule = await getAssignmentRule(scope);
  if (rule.mode === "MANUAL") return null;
  const [candidates, zones] = await Promise.all([candidatesFor(scope), listZones(scope)]);
  const { plan, lastAssignedId } = planDistribution(rule.mode, candidates, [prospect], {
    lastAssignedId: rule.lastAssignedUserId,
    zones,
  });
  if (plan.length === 0) return null;
  await applyAssignments(scope, plan, rule.mode);
  if (rule.mode === "ROUND_ROBIN") await setAssignmentRule(scope, rule.mode, lastAssignedId);
  return plan[0].agentId;
}

/** Keeps the assignment history complete when an owner changes from the prospect form. */
export async function recordOwnerChange(
  session: SessionPayload,
  prospectId: string,
  fromUserId: string | null,
  toUserId: string | null,
) {
  if (fromUserId === toUserId) return;
  await prisma.prospectAssignment.create({
    data: {
      organizationId: session.organizationId,
      prospectId,
      fromUserId,
      toUserId,
      actorId: session.userId,
      mode: "MANUAL",
    },
  });
}

export async function assignmentHistory(scope: AgentScope, options: { agentId?: string; take?: number } = {}) {
  const agentIds = (await loadAgents(scope)).map((agent) => agent.id);
  const ids = options.agentId ? agentIds.filter((id) => id === options.agentId) : agentIds;
  const rows = await prisma.prospectAssignment.findMany({
    where: {
      ...orgScope(scope.session),
      ...(scope.isTeamLead || options.agentId
        ? { OR: [{ toUserId: { in: ids } }, { fromUserId: { in: ids } }] }
        : {}),
    },
    select: {
      id: true,
      occurredAt: true,
      mode: true,
      reason: true,
      prospectId: true,
      actor: { select: { name: true } },
      fromUser: { select: { name: true } },
      toUser: { select: { name: true } },
      prospect: { select: { firstName: true, lastName: true, displayCode: true, company: { select: { name: true } } } },
    },
    orderBy: { occurredAt: "desc" },
    take: options.take ?? 200,
  });
  return rows.map((row: Row) => ({
    id: row.id as string,
    occurredAt: row.occurredAt as Date,
    mode: row.mode as string,
    reason: (row.reason as string | null) ?? null,
    prospectId: row.prospectId as string,
    prospectCode: (row.prospect?.displayCode as string | null) ?? null,
    prospectLabel: prospectLabel(row.prospect),
    actorName: (row.actor?.name as string | undefined) ?? "Système",
    fromName: (row.fromUser?.name as string | undefined) ?? null,
    toName: (row.toUser?.name as string | undefined) ?? null,
  }));
}

/* ================================================================== CRUD */

export type AgentInput = {
  name: string;
  email: string;
  phone?: string;
  civility?: string;
  teamId?: string | null;
  zoneId?: string | null;
  supervisorId?: string | null;
  matricule?: string;
  jobTitle?: string;
  hiredAt?: string | null;
  status?: AgentStatus;
  role?: Role;
  photoUrl?: string | null;
  /** Required on create; on update, empty keeps the current password. */
  password?: string;
};

const PHOTO_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_PHOTO_LENGTH = 400_000;

function validate(input: AgentInput, passwordRequired: boolean) {
  const name = input.name.trim();
  const email = normalizeStaffEmail(input.email);
  if (!name) throw new Error("Prénom et nom sont requis.");
  if (!isStaffEmail(email)) throw new Error(staffEmailMessage());
  const password = input.password ?? "";
  if ((passwordRequired || password) && password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }
  if (input.photoUrl && (input.photoUrl.length > MAX_PHOTO_LENGTH || !PHOTO_PATTERN.test(input.photoUrl))) {
    throw new Error("Photo invalide (PNG, JPEG ou WebP, 300 Ko maximum).");
  }
  if (input.hiredAt && !/^\d{4}-\d{2}-\d{2}$/.test(input.hiredAt)) throw new Error("Date d’intégration invalide.");
  const role: Role = input.role === "TEAM_LEAD" ? "TEAM_LEAD" : "SALES";
  return { name, email, password, role };
}

async function validRefs(scope: AgentScope, input: AgentInput, selfId?: string) {
  const org = orgScope(scope.session);
  const [team, zone, supervisor] = await Promise.all([
    input.teamId ? prisma.team.findFirst({ where: { id: input.teamId, ...org }, select: { id: true } }) : null,
    input.zoneId ? prisma.zone.findFirst({ where: { id: input.zoneId, ...org }, select: { id: true } }) : null,
    input.supervisorId && input.supervisorId !== selfId
      ? prisma.user.findFirst({
          where: { id: input.supervisorId, ...org, role: { in: ["OWNER", "MANAGER", "TEAM_LEAD"] } },
          select: { id: true },
        })
      : null,
  ]);
  if (input.teamId && !team) throw new Error("Équipe introuvable.");
  if (input.zoneId && !zone) throw new Error("Zone introuvable.");
  if (input.supervisorId && input.supervisorId !== selfId && !supervisor) throw new Error("Responsable introuvable.");
  return {
    teamId: (team?.id as string | undefined) ?? null,
    zoneId: (zone?.id as string | undefined) ?? null,
    supervisorId: (supervisor?.id as string | undefined) ?? null,
  };
}

function uniqueError(error: unknown) {
  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return new Error("Cet e-mail est déjà utilisé par un autre compte.");
  }
  return error;
}

export async function listSupervisors(scope: AgentScope) {
  const rows = await prisma.user.findMany({
    where: { ...orgScope(scope.session), role: { in: ["OWNER", "MANAGER", "TEAM_LEAD"] }, isActive: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  return rows as { id: string; name: string; role: Role }[];
}

export async function createAgent(scope: AgentScope, input: AgentInput) {
  const { name, email, password, role } = validate(input, true);
  const refs = await validRefs(scope, input);
  const status = input.status ?? "ACTIVE";
  let matricule = input.matricule?.trim() || "";
  if (!matricule) {
    const existing = await prisma.user.findMany({ where: orgScope(scope.session), select: { matricule: true } });
    matricule = nextMatricule(existing.map((row: Row) => row.matricule));
  }
  try {
    return await prisma.user.create({
      data: {
        organizationId: scope.session.organizationId,
        role,
        name,
        email,
        matricule,
        jobTitle: input.jobTitle?.trim() || (role === "TEAM_LEAD" ? "Responsable commercial" : "Délégué commercial"),
        hiredAt: input.hiredAt || null,
        status,
        isActive: status === "ACTIVE",
        phone: input.phone || null,
        civility: input.civility || null,
        photoUrl: input.photoUrl || null,
        ...refs,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
  } catch (error) {
    throw uniqueError(error);
  }
}

export async function updateAgent(scope: AgentScope, id: string, input: AgentInput) {
  const agent = await requireAgent(scope, id);
  const { name, email, password, role } = validate(input, false);
  const refs = await validRefs(scope, input, agent.id);
  const status = input.status ?? agent.status;
  try {
    return await prisma.user.update({
      where: { id: agent.id },
      data: {
        name,
        email,
        role,
        matricule: input.matricule?.trim() || agent.matricule,
        jobTitle: input.jobTitle?.trim() || null,
        hiredAt: input.hiredAt || null,
        status,
        isActive: status === "ACTIVE",
        phone: input.phone || null,
        civility: input.civility || null,
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl || null } : {}),
        ...refs,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });
  } catch (error) {
    throw uniqueError(error);
  }
}

export async function setAgentStatus(scope: AgentScope, id: string, status: AgentStatus) {
  const agent = await requireAgent(scope, id);
  if (agent.id === scope.session.userId) throw new Error("Tu ne peux pas changer ton propre statut.");
  return prisma.user.update({ where: { id: agent.id }, data: { status, isActive: status === "ACTIVE" } });
}

export async function deleteAgent(scope: AgentScope, id: string) {
  const agent = await requireAgent(scope, id);
  const [activities, tasks] = await Promise.all([
    prisma.activity.count({ where: { ...orgScope(scope.session), userId: agent.id } }),
    prisma.task.count({ where: { ...orgScope(scope.session), ownerId: agent.id } }),
  ]);
  const blocker = agentDeletionBlocker({ activities, tasks });
  if (blocker) throw new Error(blocker);
  // Prospects, companies and contacts owned by the agent become unassigned (FK nullOnDelete).
  await prisma.user.delete({ where: { id: agent.id } });
  return agent;
}


export async function listTeamsWithMembers(scope: AgentScope) {
  const [teams, agents] = await Promise.all([
    prisma.team.findMany({ where: orgScope(scope.session), orderBy: { name: "asc" } }),
    loadAgents({ ...scope, isTeamLead: false, teamId: null }),
  ]);
  return teams.map((team: Row) => {
    const members = agents.filter((agent) => agent.teamId === team.id);
    return {
      id: team.id as string,
      name: team.name as string,
      members,
      leads: members.filter((agent) => agent.role === "TEAM_LEAD"),
    };
  });
}

/* ================================================================== assignment helpers for the UI */

/** Active agents with their current number of open prospects, for the « destinataire » selects. */
export async function agentLoadOptions(scope: AgentScope) {
  const candidates = await candidatesFor(scope);
  return candidates
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((item) => ({ id: item.id, name: item.name, load: item.activeProspects }));
}

export function toAssignable(rows: (ProspectRow & { ownerName: string | null })[]) {
  return rows.map((row) => ({
    id: row.id,
    label: prospectLabel(row) ?? `${row.firstName} ${row.lastName}`,
    code: row.displayCode,
    company: row.company?.name ?? null,
    city: row.city,
    status: row.statusName,
    ownerName: row.ownerName,
  }));
}

/** Objective / achieved / progress for every agent and team this month (§7). */
export async function goalTracking(scope: AgentScope, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const [{ rows }, goals] = await Promise.all([performanceTable(scope, "month", now), goalsForMonth(scope, year, month)]);
  const agentRows = rows.map(({ agent, perf }) => {
    const achieved = achievedForGoals(perf, perf.activity.contacted);
    const targets = goals.byUser.get(agent.id) ?? emptyTargets();
    return {
      agent,
      achieved,
      metrics: GOAL_METRICS.map((metric) => ({ ...metric, ...goalProgress(achieved[metric.key], targets[metric.target]) })),
    };
  });
  const teamIds = [...new Set(rows.map(({ agent }) => agent.teamId).filter((id): id is string => Boolean(id)))];
  const teamRows = teamIds.map((teamId) => {
    const members = agentRows.filter((row) => row.agent.teamId === teamId);
    const targets = goals.byTeam.get(teamId) ?? emptyTargets();
    const achieved = Object.fromEntries(
      GOAL_METRICS.map((metric) => [metric.key, members.reduce((sum, row) => sum + row.achieved[metric.key], 0)]),
    ) as Record<(typeof GOAL_METRICS)[number]["key"], number>;
    return {
      teamId,
      teamName: members[0]?.agent.team?.name ?? "Équipe",
      metrics: GOAL_METRICS.map((metric) => ({ ...metric, ...goalProgress(achieved[metric.key], targets[metric.target]) })),
    };
  });
  return { year, month, agentRows, teamRows };
}
