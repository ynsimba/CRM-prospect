import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type AuditInput = {
  organizationId: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
};

export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary,
        before: input.before,
        after: input.after,
      },
    });
  } catch (error) {
    console.error("audit", error);
  }
}

export async function auditAs(
  session: SessionPayload,
  input: Omit<AuditInput, "organizationId" | "actorId">,
) {
  await writeAudit({
    organizationId: session.organizationId,
    actorId: session.userId,
    ...input,
  });
}

export async function listAuditLogs(session: SessionPayload, take = 80) {
  return prisma.auditLog.findMany({
    where: { organizationId: session.organizationId },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
