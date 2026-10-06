import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope, ownedScope } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { fullName } from "@/lib/crm";
import { historySummary } from "@/lib/safecheck";
import type { SessionPayload } from "@/lib/session";
import { isSalesRole } from "@/lib/roles";

export async function recordStatusHistory(input: {
  organizationId: string;
  prospectId: string;
  statusId: string;
  statusName: string;
  statusSlug: string;
  actorId?: string | null;
  comment?: string | null;
}) {
  await prisma.prospectStatusHistory.create({
    data: {
      organizationId: input.organizationId,
      prospectId: input.prospectId,
      statusId: input.statusId,
      statusName: input.statusName,
      statusSlug: input.statusSlug,
      actorId: input.actorId ?? null,
      comment: input.comment ?? null,
      displayCode: await nextDisplayCode(input.organizationId, "HIST"),
    },
  });
}

export async function listStatusHistory(session: SessionPayload, query?: string) {
  const q = query?.trim();
  const rows = await prisma.prospectStatusHistory.findMany({
    where: {
      ...orgScope(session),
      ...(isSalesRole(session.role) ? { prospect: ownedScope(session) } : {}),
      ...(q
        ? {
            OR: [
              { statusName: { contains: q, mode: "insensitive" } },
              { comment: { contains: q, mode: "insensitive" } },
              { prospect: { firstName: { contains: q, mode: "insensitive" } } },
              { prospect: { lastName: { contains: q, mode: "insensitive" } } },
              { prospect: { company: { name: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      actor: { select: { name: true } },
      prospect: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayCode: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 120,
  });

  return rows.map((row) => {
    const companyName = row.prospect.company?.name ?? fullName(row.prospect.firstName, row.prospect.lastName);
    return {
      ...row,
      companyName,
      summary: historySummary(companyName, row.occurredAt),
    };
  });
}

export async function notifyDirectorsOfFinalStatus(input: {
  session: SessionPayload;
  prospect: { id: string; firstName: string; lastName: string; ownerId: string | null };
  statusName: string;
  comment?: string | null;
  ownerName?: string | null;
}) {
  const directors = await prisma.user.findMany({
    where: {
      organizationId: input.session.organizationId,
      isActive: true,
      role: { in: ["OWNER", "MANAGER"] },
    },
    select: { id: true },
  });
  const company = fullName(input.prospect.firstName, input.prospect.lastName);
  const reason = input.comment?.trim() || "Sans commentaire";
  const body = `${company} · ${input.statusName} · ${input.ownerName ?? "non assigné"} · ${reason}`;

  for (const director of directors) {
    await notify({
      organizationId: input.session.organizationId,
      userId: director.id,
      title: `Statut ${input.statusName}`,
      body,
      kind: "status-final",
      href: `/prospects/${input.prospect.id}`,
    });
  }
}

export async function nextDisplayCode(organizationId: string, prefix: "ENT" | "CTC" | "ACT" | "HIST" | "POR") {
  const count =
    prefix === "ENT"
      ? await prisma.company.count({ where: { organizationId } })
      : prefix === "POR"
        ? await prisma.contact.count({ where: { organizationId, category: "porteur" } })
        : prefix === "CTC"
          ? await prisma.contact.count({ where: { organizationId } })
          : prefix === "HIST"
            ? await prisma.prospectStatusHistory.count({ where: { organizationId } })
            : await prisma.task.count({ where: { organizationId } });
  return `${prefix}-${String(count + 1).padStart(3, "0")}`;
}
