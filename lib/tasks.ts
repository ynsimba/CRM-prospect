import "server-only";

import { ProspectPriority, Role, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orgScope, ownedScope } from "@/lib/auth";
import { nextTaskStatus, TASK_STATUS_LABELS } from "@/lib/activity-logic";
import { notify } from "@/lib/notifications";
import { isSalesRole } from "@/lib/roles";
import type { SessionPayload } from "@/lib/session";
import { nextDisplayCode } from "@/lib/status-history";

const taskInclude = {
  owner: { select: { id: true, name: true, team: { select: { id: true, name: true } } } },
  assignedBy: { select: { id: true, name: true } },
  prospect: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayCode: true,
      company: { select: { name: true } },
    },
  },
  company: { select: { id: true, name: true } },
  opportunity: { select: { id: true, name: true } },
} as const;

export type TaskFilters = {
  q?: string;
  status?: TaskStatus;
  ownerId?: string;
  assignedById?: string;
  salesOwners?: boolean;
  closed?: boolean;
  sort?: "due" | "live";
};

export async function listTasks(session: SessionPayload, filters: TaskFilters = {}) {
  const q = filters.q?.trim();
  return prisma.task.findMany({
    where: {
      ...orgScope(session),
      ...ownedScope(session),
      ...(filters.closed === true
        ? { status: { in: ["DONE", "CANCELLED"] } }
        : filters.closed === false
          ? { status: { in: ["TODO", "IN_PROGRESS"] } }
          : filters.status
            ? { status: filters.status }
            : {}),
      ...(filters.ownerId && session.role !== "SALES" ? { ownerId: filters.ownerId } : {}),
      ...(filters.assignedById ? { assignedById: filters.assignedById } : {}),
      ...(filters.salesOwners || filters.assignedById ? { owner: { role: Role.SALES } } : {}),
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
    orderBy:
      filters.sort === "live"
        ? [{ updatedAt: "desc" }]
        : [{ status: "asc" }, { dueAt: "asc" }],
    take: 200,
  });
}

async function resolveTaskOwnerId(session: SessionPayload, ownerId?: string) {
  if (isSalesRole(session.role)) {
    return session.userId;
  }
  if (!ownerId) {
    throw new Error("Choisis un agent commercial.");
  }
  const agent = await prisma.user.findFirst({
    where: {
      id: ownerId,
      organizationId: session.organizationId,
      isActive: true,
      role: Role.SALES,
    },
    select: { id: true, name: true },
  });
  if (!agent) {
    throw new Error("Le destinataire doit être un agent commercial actif.");
  }
  return agent.id;
}

async function notifyTaskOwner(input: {
  organizationId: string;
  ownerId: string;
  actorId: string;
  title: string;
  body: string;
}) {
  if (input.ownerId === input.actorId) return;
  await notify({
    organizationId: input.organizationId,
    userId: input.ownerId,
    title: input.title,
    body: input.body,
    kind: "task",
    href: "/taches",
  });
}

async function notifyTaskDirector(input: {
  organizationId: string;
  assignedById?: string | null;
  actorId: string;
  title: string;
  body: string;
}) {
  if (!input.assignedById || input.assignedById === input.actorId) return;
  await notify({
    organizationId: input.organizationId,
    userId: input.assignedById,
    title: input.title,
    body: input.body,
    kind: "task",
    href: "/direction/taches",
  });
}

export function groupTasksByDepartment<T extends { owner: { team?: { name: string } | null } }>(tasks: T[]) {
  const buckets = new Map<string, { label: string; items: T[] }>();
  for (const task of tasks) {
    const label = task.owner.team?.name?.trim() || "Sans département";
    const bucket = buckets.get(label) ?? { label, items: [] };
    bucket.items.push(task);
    buckets.set(label, bucket);
  }
  return [...buckets.values()];
}

export async function createTask(
  session: SessionPayload,
  input: {
    title: string;
    description?: string;
    priority: ProspectPriority;
    dueAt?: Date;
    ownerId?: string;
    directorNote?: string;
    ownerNote?: string;
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

  const ownerId = await resolveTaskOwnerId(session, input.ownerId);
  const task = await prisma.task.create({
    data: {
      organizationId: session.organizationId,
      displayCode: await nextDisplayCode(session.organizationId, "ACT"),
      ownerId,
      assignedById: session.userId,
      title,
      description: input.description,
      directorNote: input.directorNote,
      ownerNote: input.ownerNote,
      priority: input.priority,
      dueAt: input.dueAt,
      prospectId: input.prospectId,
      companyId: input.companyId,
      opportunityId: input.opportunityId,
    },
  });
  await notifyTaskOwner({
    organizationId: session.organizationId,
    ownerId,
    actorId: session.userId,
    title: "Nouvelle tâche assignée",
    body: title,
  });
  return task;
}

export async function setTaskStatus(session: SessionPayload, taskId: string, status: TaskStatus, ownerNote?: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session), ...ownedScope(session) },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }
  if (status === "CANCELLED" && !ownerNote?.trim() && !task.ownerNote?.trim()) {
    throw new Error("Le commentaire commercial est obligatoire pour une clôture incomplète.");
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      status,
      ...(ownerNote !== undefined ? { ownerNote } : {}),
    },
  });
  await notifyTaskDirector({
    organizationId: session.organizationId,
    assignedById: task.assignedById,
    actorId: session.userId,
    title: `Tâche ${TASK_STATUS_LABELS[status]}`,
    body: `${task.title} — ${session.name}`,
  });
  return updated;
}

export async function setTaskOwnerNote(session: SessionPayload, taskId: string, ownerNote: string) {
  const note = ownerNote.trim();
  if (!note) {
    throw new Error("Le commentaire commercial est requis.");
  }
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session), ...ownedScope(session) },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { ownerNote: note },
  });
  await notifyTaskDirector({
    organizationId: session.organizationId,
    assignedById: task.assignedById,
    actorId: session.userId,
    title: "Compte-rendu commercial",
    body: `${task.title} — ${note}`,
  });
  return updated;
}

export async function setTaskDirectorNote(session: SessionPayload, taskId: string, directorNote: string | null) {
  if (isSalesRole(session.role)) {
    throw new Error("Seul un manager peut commenter cette tâche.");
  }
  const note = directorNote?.trim() || null;
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session), owner: { role: Role.SALES } },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { directorNote: note },
  });
  await notifyTaskOwner({
    organizationId: session.organizationId,
    ownerId: task.ownerId,
    actorId: session.userId,
    title: "Commentaire de la direction",
    body: note ? `${task.title} — ${note}` : `${task.title} — commentaire retiré`,
  });
  return updated;
}

export async function advanceTask(session: SessionPayload, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...orgScope(session), ...ownedScope(session) },
  });
  if (!task) {
    throw new Error("Tâche introuvable.");
  }
  const next = nextTaskStatus(task.status);
  if (!next) {
    throw new Error("Cette tâche est déjà close.");
  }
  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status: next },
  });
  await notifyTaskDirector({
    organizationId: session.organizationId,
    assignedById: task.assignedById,
    actorId: session.userId,
    title: `Tâche ${TASK_STATUS_LABELS[next]}`,
    body: `${task.title} — ${session.name}`,
  });
  return updated;
}
