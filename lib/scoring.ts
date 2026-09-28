import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { computeProspectScore, fullName, scoreBand } from "@/lib/crm";
import { HOT_SCORE } from "@/lib/notify-logic";
import { notify } from "@/lib/notifications";
import type { SessionPayload } from "@/lib/session";

export async function refreshProspectScore(session: SessionPayload, prospectId: string) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, ...orgScope(session) },
    include: {
      status: true,
      tags: { include: { tag: true } },
      activities: { select: { type: true } },
    },
  });
  if (!prospect) return null;

  const previous = prospect.score;
  const { score } = computeProspectScore({
    email: prospect.email,
    phone: prospect.phone,
    whatsapp: prospect.whatsapp,
    companyId: prospect.companyId,
    jobTitle: prospect.jobTitle,
    priority: prospect.priority,
    tags: prospect.tags.map((item: { tag: { name: string } }) => item.tag.name),
    statusSlug: prospect.status.slug,
    activityTypes: prospect.activities.map((item: { type: string }) => item.type),
    lastContactAt: prospect.lastContactAt,
    nextContactAt: prospect.nextContactAt,
  });

  if (score !== previous) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { score },
    });
  }

  if (previous < HOT_SCORE && score >= HOT_SCORE && prospect.ownerId) {
    await notify({
      organizationId: session.organizationId,
      userId: prospect.ownerId,
      title: "Lead très chaud",
      body: `${fullName(prospect.firstName, prospect.lastName)} passe à ${score} (${scoreBand(score)}).`,
      kind: "score",
      href: `/prospects/${prospect.id}`,
    });
  }

  return { ...prospect, score };
}
