import "server-only";

import { ProspectPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { nextTaskStatus } from "@/lib/activity-logic";
import type { SessionPayload } from "@/lib/session";

const taskInclude = {
  owner: { select: { id: true, name: true } },
  prospect: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  opportunity: { select: { id: true, name: true } },
} as const;

export type TaskFilters = {
  q?: string;
  status?: TaskStatus;
  ownerId?: string;
};

export async function listTasks(session: SessionPayload, filters: TaskFilters = {}) {
  const q = filters.q?.trim();
  return prisma.task.findMany({
    where: {
      ...orgScope(session),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { prospect: { firstName: { contains: q, mode: "insensitive" } } },
              { prospect: { lastName: { contains: q, mode: "insensitive" } } },
              { opportunity: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: 80,
  });
}

export async function createTask(
  session: SessionPayload,
  input: {
    title: string;
    description?: string;
    priority: ProspectPriority;
    dueAt?: Date;
    ownerId?: string;
    prospectId?: string;
    companyId?: string;
    opportunityId?: string;
  },
) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Le titre de la tâche est requis.");
  }

  if (input.prospectId) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: input.prospectId, ...orgScope(session) },
      select: { id: true, companyId: true },
    });
    if (!prospect) throw new Error("Prospect introuvable.");
    input.companyId = input.companyId ?? prospect.companyId ?? undefined;
  }

  if (input.opportunityId) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: input.opportunityId, ...orgScope(session) },
      select: { id: true, prospectId: true, companyId: true },
    });
    if (!opportunity) throw new Error("Opportunité introuvable.");
    input.prospectId = input.prospectId ?? opportunity.prospectId ?? undefined;
    input.companyId = input.companyId ?? opportunity.companyId ?? undefined;
  }

  return prisma.task.create({
    data: {
      organizationId: session.organizationId,
      ownerId: input.ownerId ?? session.userId,
      title,
      description: input.description,
      priority: input.priority,
      dueAt: input.dueAt,
      prospectId: input.prospectId,
      companyId: input.companyId,
      opportunityId: input.opportunityId,
    },
  });
}

export async function setTaskStatus(session: SessionPayload, taskId: string, status: TaskStatus) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session) },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }

  return prisma.task.update({
    where: { id: task.id },
    data: { status },
  });
}

export async function advanceTask(session: SessionPayload, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session) },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }
  const next = nextTaskStatus(task.status);
  if (!next) {
    throw new Error("Cette tâche est déjà close.");
  }
  return prisma.task.update({
    where: { id: task.id },
    data: { status: next },
  });
}
