import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { startOfDay } from "@/lib/activity-logic";
import { encodeNotificationBody } from "@/lib/notify-logic";
import type { SessionPayload } from "@/lib/session";

export async function notify(input: {
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  kind?: string;
  href?: string;
}) {
  const body = encodeNotificationBody(input.body, input.href);
  const existing = await prisma.notification.findFirst({
    where: {
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
      body,
      readAt: null,
    },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      title: input.title,
      body,
      kind: input.kind ?? "info",
    },
  });
}

export async function listNotifications(session: SessionPayload, take = 40) {
  return prisma.notification.findMany({
    where: { organizationId: session.organizationId, userId: session.userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnreadNotifications(session: SessionPayload) {
  return prisma.notification.count({
    where: { organizationId: session.organizationId, userId: session.userId, readAt: null },
  });
}

export async function markNotificationRead(session: SessionPayload, id: string) {
  const row = await prisma.notification.findFirst({
    where: { id, ...orgScope(session), userId: session.userId },
  });
  if (!row) {
    throw new Error("Notification introuvable.");
  }
  return prisma.notification.update({
    where: { id: row.id },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(session: SessionPayload) {
  await prisma.notification.updateMany({
    where: { organizationId: session.organizationId, userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function ensureDueNotifications(session: SessionPayload) {
  if (session.role === "SUPER_ADMIN") return;

  const today = startOfDay(new Date());
  const [prospects, tasks] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        ...orgScope(session),
        ownerId: session.userId,
        convertedAt: null,
        nextContactAt: { lt: today },
      },
      select: { id: true, firstName: true, lastName: true, nextContactAt: true },
      take: 20,
    }),
    prisma.task.findMany({
      where: {
        ...orgScope(session),
        ownerId: session.userId,
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { lt: today },
      },
      select: { id: true, title: true, dueAt: true },
      take: 20,
    }),
  ]);

  for (const prospect of prospects) {
    await notify({
      organizationId: session.organizationId,
      userId: session.userId,
      title: "Relance en retard",
      body: `${prospect.firstName} ${prospect.lastName} devait être recontacté.`,
      kind: "followup",
      href: `/prospects/${prospect.id}`,
    });
  }

  for (const task of tasks) {
    await notify({
      organizationId: session.organizationId,
      userId: session.userId,
      title: "Tâche en retard",
      body: task.title,
      kind: "task",
      href: "/taches",
    });
  }
}
