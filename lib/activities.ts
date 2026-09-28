import "server-only";

import { ActivityType } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { isContactActivity } from "@/lib/activity-logic";
import { refreshProspectScore } from "@/lib/scoring";
import type { SessionPayload } from "@/lib/session";

const activityInclude = {
  user: { select: { name: true } },
  prospect: { select: { id: true, firstName: true, lastName: true } },
  company: { select: { id: true, name: true } },
  opportunity: { select: { id: true, name: true } },
} as const;

export async function listRecentActivities(session: SessionPayload, take = 40) {
  return prisma.activity.findMany({
    where: orgScope(session),
    include: activityInclude,
    orderBy: { occurredAt: "desc" },
    take,
  });
}

export async function createActivity(
  session: SessionPayload,
  input: {
    type: ActivityType;
    comment?: string;
    outcome?: string;
    durationMin?: number;
    occurredAt?: Date;
    prospectId?: string;
    companyId?: string;
    opportunityId?: string;
    nextContactAt?: Date;
  },
) {
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

  const occurredAt = input.occurredAt ?? new Date();

  const activity = await prisma.activity.create({
    data: {
      organizationId: session.organizationId,
      userId: session.userId,
      type: input.type,
      comment: input.comment,
      outcome: input.outcome,
      durationMin: input.durationMin,
      occurredAt,
      prospectId: input.prospectId,
      companyId: input.companyId,
      opportunityId: input.opportunityId,
    },
  });

  if (input.prospectId && (isContactActivity(input.type) || input.nextContactAt)) {
    await prisma.prospect.update({
      where: { id: input.prospectId },
      data: {
        ...(isContactActivity(input.type) ? { lastContactAt: occurredAt } : {}),
        ...(input.nextContactAt ? { nextContactAt: input.nextContactAt } : {}),
      },
    });
  }

  if (input.prospectId) {
    await refreshProspectScore(session, input.prospectId);
  }

  return activity;
}
