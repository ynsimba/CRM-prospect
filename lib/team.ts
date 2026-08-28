import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { compareReps } from "@/lib/goal-logic";
import type { SessionPayload } from "@/lib/session";

function monthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end, month: monthIndex + 1, year };
}

function countMap(rows: { ownerId: string | null; _count: { _all: number } }[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.ownerId) map.set(row.ownerId, row._count._all);
  }
  return map;
}

export async function listTeams(session: SessionPayload) {
  return prisma.team.findMany({
    where: orgScope(session),
    include: { _count: { select: { members: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createTeam(session: SessionPayload, name: string) {
  const label = name.trim();
  if (!label) {
    throw new Error("Le nom de l’équipe est requis.");
  }
  return prisma.team.create({
    data: { organizationId: session.organizationId, name: label },
  });
}

export async function assignUserTeam(session: SessionPayload, userId: string, teamId: string | null) {
  const user = await prisma.user.findFirst({
    where: { id: userId, ...orgScope(session), role: { not: "SUPER_ADMIN" } },
  });
  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }
  if (teamId) {
    const team = await prisma.team.findFirst({
      where: { id: teamId, ...orgScope(session) },
      select: { id: true },
    });
    if (!team) {
      throw new Error("Équipe introuvable.");
    }
  }
  return prisma.user.update({
    where: { id: user.id },
    data: { teamId },
  });
}

export async function upsertGoal(
  session: SessionPayload,
  input: {
    userId: string;
    year: number;
    month: number;
    prospectsTarget: number;
    meetingsTarget: number;
    opportunitiesTarget: number;
    revenueTarget: number;
  },
) {
  const user = await prisma.user.findFirst({
    where: { id: input.userId, ...orgScope(session) },
    select: { id: true },
  });
  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }
  if (input.month < 1 || input.month > 12) {
    throw new Error("Mois invalide.");
  }

  return prisma.goal.upsert({
    where: {
      organizationId_userId_year_month: {
        organizationId: session.organizationId,
        userId: user.id,
        year: input.year,
        month: input.month,
      },
    },
    update: {
      prospectsTarget: input.prospectsTarget,
      meetingsTarget: input.meetingsTarget,
      opportunitiesTarget: input.opportunitiesTarget,
      revenueTarget: input.revenueTarget,
    },
    create: {
      organizationId: session.organizationId,
      userId: user.id,
      year: input.year,
      month: input.month,
      prospectsTarget: input.prospectsTarget,
      meetingsTarget: input.meetingsTarget,
      opportunitiesTarget: input.opportunitiesTarget,
      revenueTarget: input.revenueTarget,
    },
  });
}

export async function getTeamPerformance(session: SessionPayload, year: number, monthIndex: number) {
  const { start, end, month } = monthRange(year, monthIndex);
  const scope = orgScope(session);

  const users = await prisma.user.findMany({
    where: { ...scope, isActive: true, role: { not: "SUPER_ADMIN" } },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const userIds = users.map((user) => user.id);

  const [prospectRows, meetingRows, oppRows, wonRows, openRows, goals] = await Promise.all([
    prisma.prospect.groupBy({
      by: ["ownerId"],
      where: { ...scope, ownerId: { in: userIds }, createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ["userId"],
      where: {
        ...scope,
        userId: { in: userIds },
        type: { in: ["MEETING", "VISIT", "DEMO"] },
        occurredAt: { gte: start, lte: end },
      },
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["ownerId"],
      where: { ...scope, ownerId: { in: userIds }, createdAt: { gte: start, lte: end } },
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["ownerId"],
      where: { ...scope, ownerId: { in: userIds }, status: "WON", updatedAt: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["ownerId"],
      where: { ...scope, ownerId: { in: userIds }, status: "OPEN" },
      _sum: { amount: true },
    }),
    prisma.goal.findMany({
      where: { ...scope, year, month, userId: { in: userIds } },
    }),
  ]);

  const prospects = countMap(prospectRows);
  const opps = countMap(oppRows);
  const meetings = new Map<string, number>();
  for (const row of meetingRows) meetings.set(row.userId, row._count._all);
  const won = new Map(wonRows.map((row) => [row.ownerId ?? "", row._sum.amount ?? 0]));
  const wonDeals = new Map(wonRows.map((row) => [row.ownerId ?? "", row._count._all]));
  const open = new Map(openRows.map((row) => [row.ownerId ?? "", row._sum.amount ?? 0]));
  const goalByUser = new Map(goals.filter((item) => item.userId).map((item) => [item.userId as string, item]));

  const reps = users.map((user) => {
    const goal = goalByUser.get(user.id);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamName: user.team?.name ?? null,
      lastLoginAt: user.lastLoginAt,
      prospects: prospects.get(user.id) ?? 0,
      meetings: meetings.get(user.id) ?? 0,
      opportunities: opps.get(user.id) ?? 0,
      wonRevenue: won.get(user.id) ?? 0,
      wonDeals: wonDeals.get(user.id) ?? 0,
      openPipeline: open.get(user.id) ?? 0,
      goal,
    };
  });

  reps.sort(compareReps);

  const totals = reps.reduce(
    (acc, rep) => {
      acc.prospects += rep.prospects;
      acc.meetings += rep.meetings;
      acc.opportunities += rep.opportunities;
      acc.wonRevenue += rep.wonRevenue;
      acc.openPipeline += rep.openPipeline;
      acc.revenueTarget += rep.goal?.revenueTarget ?? 0;
      return acc;
    },
    {
      prospects: 0,
      meetings: 0,
      opportunities: 0,
      wonRevenue: 0,
      openPipeline: 0,
      revenueTarget: 0,
    },
  );

  return { reps, totals, year, month };
}
