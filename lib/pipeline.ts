import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { opportunityStatusFromStage, weightedAmount } from "@/lib/pipeline-logic";
import { notify } from "@/lib/notifications";
import { refreshProspectScore } from "@/lib/scoring";
import type { SessionPayload } from "@/lib/session";

const opportunityInclude = {
  company: { select: { id: true, name: true } },
  prospect: { select: { id: true, firstName: true, lastName: true } },
  owner: { select: { id: true, name: true } },
  stage: true,
} as const;

export async function getDefaultPipeline(session: SessionPayload) {
  return prisma.pipeline.findFirst({
    where: { ...orgScope(session), isDefault: true },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getPipelineBoard(session: SessionPayload, ownerId?: string) {
  const pipeline = await getDefaultPipeline(session);
  if (!pipeline) return null;

  const opportunities = await prisma.opportunity.findMany({
    where: {
      ...orgScope(session),
      pipelineId: pipeline.id,
      ...(ownerId ? { ownerId } : {}),
    },
    include: opportunityInclude,
    orderBy: { updatedAt: "desc" },
  });

  const columns = pipeline.stages.map((stage) => {
    const items = opportunities.filter((item) => item.stageId === stage.id);
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const weighted = items.reduce((sum, item) => sum + weightedAmount(item.amount, item.probability), 0);
    return { ...stage, opportunities: items, total, weighted };
  });

  const open = opportunities.filter((item) => item.status === "OPEN");
  const won = opportunities.filter((item) => item.status === "WON");
  const openTotal = open.reduce((sum, item) => sum + item.amount, 0);
  const openWeighted = open.reduce((sum, item) => sum + weightedAmount(item.amount, item.probability), 0);

  return {
    pipeline,
    columns,
    totals: {
      openCount: open.length,
      wonCount: won.length,
      openTotal,
      openWeighted,
    },
  };
}

export async function getOpportunity(session: SessionPayload, id: string) {
  return prisma.opportunity.findFirst({
    where: { id, ...orgScope(session) },
    include: {
      ...opportunityInclude,
      pipeline: { select: { name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 30,
      },
      tasks: {
        include: { owner: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
        take: 20,
      },
    },
  });
}

export async function getPipelineOptions(session: SessionPayload) {
  const scope = orgScope(session);
  const [pipeline, companies, owners, prospects] = await Promise.all([
    getDefaultPipeline(session),
    prisma.company.findMany({
      where: scope,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { ...scope, isActive: true, role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.prospect.findMany({
      where: scope,
      select: { id: true, firstName: true, lastName: true, companyId: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
  ]);

  return { pipeline, companies, owners, prospects };
}

async function assertStage(session: SessionPayload, stageId: string) {
  const pipeline = await getDefaultPipeline(session);
  const stage = pipeline?.stages.find((item) => item.id === stageId);
  if (!pipeline || !stage) {
    throw new Error("Étape de pipeline introuvable.");
  }
  return { pipeline, stage };
}

export async function createOpportunity(
  session: SessionPayload,
  input: {
    name: string;
    amount: number;
    stageId: string;
    companyId?: string;
    prospectId?: string;
    ownerId?: string;
    expectedCloseAt?: Date;
    description?: string;
  },
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Le nom de l’opportunité est requis.");
  }
  if (input.amount < 0) {
    throw new Error("Le montant ne peut pas être négatif.");
  }

  const { pipeline, stage } = await assertStage(session, input.stageId);
  const org = await prisma.organization.findFirst({
    where: { id: session.organizationId },
    select: { currency: true },
  });

  if (input.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: input.companyId, ...orgScope(session) },
      select: { id: true },
    });
    if (!company) throw new Error("Entreprise introuvable.");
  }

  if (input.prospectId) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: input.prospectId, ...orgScope(session) },
      select: { id: true },
    });
    if (!prospect) throw new Error("Prospect introuvable.");
  }

  return prisma.opportunity.create({
    data: {
      organizationId: session.organizationId,
      pipelineId: pipeline.id,
      stageId: stage.id,
      name,
      amount: input.amount,
      currency: org?.currency ?? "CDF",
      probability: stage.probability,
      status: opportunityStatusFromStage(stage),
      companyId: input.companyId,
      prospectId: input.prospectId,
      ownerId: input.ownerId ?? session.userId,
      expectedCloseAt: input.expectedCloseAt,
      description: input.description,
    },
  });
}

export async function moveOpportunity(session: SessionPayload, opportunityId: string, stageId: string) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: opportunityId, ...orgScope(session) },
  });
  if (!opportunity) {
    throw new Error("Opportunité introuvable.");
  }

  const { pipeline, stage } = await assertStage(session, stageId);
  if (opportunity.pipelineId !== pipeline.id) {
    throw new Error("Cette opportunité n’appartient pas à ce pipeline.");
  }

  const updated = await prisma.opportunity.update({
    where: { id: opportunity.id },
    data: {
      stageId: stage.id,
      probability: stage.probability,
      status: opportunityStatusFromStage(stage),
    },
  });

  if (opportunity.status !== "WON" && updated.status === "WON" && updated.ownerId) {
    await notify({
      organizationId: session.organizationId,
      userId: updated.ownerId,
      title: "Affaire gagnée",
      body: updated.name,
      kind: "deal",
      href: `/pipeline/${updated.id}`,
    });
  }

  return updated;
}

export async function convertProspectToOpportunity(
  session: SessionPayload,
  prospectId: string,
  input: { name: string; amount: number; stageId?: string },
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Le nom de l’opportunité est requis.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const prospect = await tx.prospect.findFirst({
      where: { id: prospectId, ...orgScope(session) },
      include: { company: { select: { name: true } } },
    });
    if (!prospect) {
      throw new Error("Prospect introuvable.");
    }

    const open = await tx.opportunity.findFirst({
      where: { prospectId: prospect.id, organizationId: session.organizationId, status: "OPEN" },
    });
    if (open) {
      throw new Error("Une opportunité ouverte existe déjà pour ce prospect.");
    }

    const pipeline = await tx.pipeline.findFirst({
      where: { organizationId: session.organizationId, isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    });
    if (!pipeline) {
      throw new Error("Aucun pipeline par défaut.");
    }

    const stage =
      pipeline.stages.find((item) => item.id === input.stageId) ??
      pipeline.stages.find((item) => item.name === "Qualifié") ??
      pipeline.stages.find((item) => !item.isWon && !item.isLost);

    if (!stage) {
      throw new Error("Aucune étape ouverte dans le pipeline.");
    }

    const convertedStatus = await tx.prospectStatus.findFirst({
      where: { organizationId: session.organizationId, isConverted: true },
    });

    const org = await tx.organization.findFirst({
      where: { id: session.organizationId },
      select: { currency: true },
    });

    const opportunity = await tx.opportunity.create({
      data: {
        organizationId: session.organizationId,
        pipelineId: pipeline.id,
        stageId: stage.id,
        name,
        amount: input.amount,
        currency: org?.currency ?? "CDF",
        probability: stage.probability,
        status: opportunityStatusFromStage(stage),
        companyId: prospect.companyId,
        contactId: prospect.contactId,
        prospectId: prospect.id,
        ownerId: prospect.ownerId ?? session.userId,
        source: "conversion",
      },
    });

    if (convertedStatus) {
      await tx.prospect.update({
        where: { id: prospect.id },
        data: { statusId: convertedStatus.id, convertedAt: new Date() },
      });
    }

    return opportunity;
  });

  if (created.ownerId) {
    await notify({
      organizationId: session.organizationId,
      userId: created.ownerId,
      title: "Prospect converti",
      body: created.name,
      kind: "deal",
      href: `/pipeline/${created.id}`,
    });
  }
  await refreshProspectScore(session, prospectId);
  return created;
}
