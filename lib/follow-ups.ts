import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { followUpBucket, startOfDay } from "@/lib/activity-logic";
import { fullName } from "@/lib/crm";
import type { SessionPayload } from "@/lib/session";

export type FollowUpItem = {
  id: string;
  kind: "prospect" | "task";
  title: string;
  dueAt: Date;
  ownerName: string | null;
  href: string;
  bucket: "overdue" | "today" | "upcoming";
};

export async function listFollowUps(session: SessionPayload) {
  const today = startOfDay(new Date());
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + 21);

  const [prospects, tasks] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        ...orgScope(session),
        convertedAt: null,
        nextContactAt: { not: null, lte: horizon },
      },
      include: { owner: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...orgScope(session),
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { not: null, lte: horizon },
      },
      include: {
        owner: { select: { name: true } },
        prospect: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const items: FollowUpItem[] = [
    ...prospects
      .filter((item) => item.nextContactAt)
      .map((item) => ({
        id: `prospect-${item.id}`,
        kind: "prospect" as const,
        title: fullName(item.firstName, item.lastName),
        dueAt: item.nextContactAt as Date,
        ownerName: item.owner?.name ?? null,
        href: `/prospects/${item.id}`,
        bucket: followUpBucket(item.nextContactAt as Date, today),
      })),
    ...tasks
      .filter((item) => item.dueAt)
      .map((item) => ({
        id: `task-${item.id}`,
        kind: "task" as const,
        title: item.prospect
          ? `${item.title} · ${fullName(item.prospect.firstName, item.prospect.lastName)}`
          : item.title,
        dueAt: item.dueAt as Date,
        ownerName: item.owner.name,
        href: "/taches",
        bucket: followUpBucket(item.dueAt as Date, today),
      })),
  ];

  items.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  return items;
}

export async function monthFollowUps(session: SessionPayload, year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  const today = startOfDay(new Date());

  const [prospects, tasks] = await Promise.all([
    prisma.prospect.findMany({
      where: {
        ...orgScope(session),
        convertedAt: null,
        nextContactAt: { gte: start, lte: end },
      },
      include: { owner: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: {
        ...orgScope(session),
        status: { in: ["TODO", "IN_PROGRESS"] },
        dueAt: { gte: start, lte: end },
      },
      include: {
        owner: { select: { name: true } },
        prospect: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  const items: FollowUpItem[] = [
    ...prospects
      .filter((item) => item.nextContactAt)
      .map((item) => ({
        id: `prospect-${item.id}`,
        kind: "prospect" as const,
        title: fullName(item.firstName, item.lastName),
        dueAt: item.nextContactAt as Date,
        ownerName: item.owner?.name ?? null,
        href: `/prospects/${item.id}`,
        bucket: followUpBucket(item.nextContactAt as Date, today),
      })),
    ...tasks
      .filter((item) => item.dueAt)
      .map((item) => ({
        id: `task-${item.id}`,
        kind: "task" as const,
        title: item.title,
        dueAt: item.dueAt as Date,
        ownerName: item.owner.name,
        href: "/taches",
        bucket: followUpBucket(item.dueAt as Date, today),
      })),
  ];

  return items;
}
