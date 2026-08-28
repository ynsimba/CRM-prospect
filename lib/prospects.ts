import "server-only";

import { ProspectPriority, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { computeProspectScore, FOLLOW_UP_STATUS_SLUGS, fullName, type ProspectFilters } from "@/lib/crm";
import { notify } from "@/lib/notifications";
import { refreshProspectScore } from "@/lib/scoring";
import type { SessionPayload } from "@/lib/session";

export type { ProspectFilters };

function scoreWhere(score: ProspectFilters["score"]): Prisma.IntFilter | undefined {
  if (score === "froid") return { lte: 30 };
  if (score === "tiede") return { gt: 30, lte: 60 };
  if (score === "chaud") return { gt: 60, lte: 80 };
  if (score === "tres-chaud") return { gt: 80 };
  return undefined;
}

function searchClause(q: string): Prisma.ProspectWhereInput {
  return {
    OR: [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { company: { name: { contains: q, mode: "insensitive" } } },
    ],
  };
}

function extraProspectClauses(filters: ProspectFilters): Prisma.ProspectWhereInput[] {
  const extra: Prisma.ProspectWhereInput[] = [];
  const q = filters.q?.trim();
  if (q) extra.push(searchClause(q));
  if (filters.archived === true) {
    extra.push({ status: { OR: [{ isConverted: true }, { isLost: true }] } });
  } else if (filters.archived === false) {
    extra.push({ status: { isConverted: false, isLost: false } });
  }
  if (filters.followUp) {
    extra.push({
      status: { isConverted: false, isLost: false },
      OR: [
        { nextContactAt: { not: null } },
        { lastContactAt: { not: null } },
        { status: { slug: { in: [...FOLLOW_UP_STATUS_SLUGS] } } },
      ],
    });
  }
  return extra;
}

function prospectOrderBy(sort: ProspectFilters["sort"]): Prisma.ProspectOrderByWithRelationInput[] {
  if (sort === "name") return [{ lastName: "asc" }, { firstName: "asc" }];
  if (sort === "company") return [{ company: { name: "asc" } }, { lastName: "asc" }];
  if (sort === "score") return [{ score: "desc" }, { updatedAt: "desc" }];
  if (sort === "priority") return [{ priority: "desc" }, { updatedAt: "desc" }];
  return [{ updatedAt: "desc" }];
}

export async function listProspects(session: SessionPayload, filters: ProspectFilters = {}) {
  const extra = extraProspectClauses(filters);
  return prisma.prospect.findMany({
    where: {
      ...orgScope(session),
      ...(filters.statusId ? { statusId: filters.statusId } : {}),
      ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
      ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
      ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
      ...(scoreWhere(filters.score) ? { score: scoreWhere(filters.score) } : {}),
      ...(extra.length === 1 ? extra[0] : extra.length > 1 ? { AND: extra } : {}),
    },
    include: {
      company: { select: { id: true, name: true, industry: true, address: true, city: true } },
      status: true,
      source: true,
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      activities: { select: { occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 1 },
    },
    orderBy: prospectOrderBy(filters.sort),
    take: 80,
  });
}

export async function getProspect(session: SessionPayload, id: string) {
  return prisma.prospect.findFirst({
    where: { id, ...orgScope(session) },
    include: {
      company: true,
      contact: true,
      status: true,
      source: true,
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 30,
      },
      opportunities: {
        select: { id: true, name: true, amount: true, status: true, stage: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      },
      tasks: {
        include: { owner: { select: { name: true } } },
        orderBy: { dueAt: "asc" },
        take: 20,
      },
    },
  });
}

export async function findDuplicateProspects(
  session: SessionPayload,
  input: { email?: string | null; phone?: string | null; whatsapp?: string | null },
) {
  const clauses: Prisma.ProspectWhereInput[] = [];
  if (input.email) clauses.push({ email: { equals: input.email, mode: "insensitive" } });
  if (input.phone) clauses.push({ phone: input.phone });
  if (input.whatsapp) clauses.push({ whatsapp: input.whatsapp });
  if (clauses.length === 0) return [];

  return prisma.prospect.findMany({
    where: { ...orgScope(session), OR: clauses },
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    take: 5,
  });
}

export async function createProspect(
  session: SessionPayload,
  input: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    category?: string;
    companyId?: string;
    statusId: string;
    sourceId?: string;
    ownerId?: string;
    priority: ProspectPriority;
    notes?: string;
    tagIds?: string[];
  },
) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("Le prénom et le nom sont requis.");
  }

  const status = await prisma.prospectStatus.findFirst({
    where: { id: input.statusId, ...orgScope(session) },
  });
  if (!status) {
    throw new Error("Statut invalide.");
  }

  const duplicates = await findDuplicateProspects(session, {
    email: input.email,
    phone: input.phone,
    whatsapp: input.whatsapp,
  });
  if (duplicates.length > 0) {
    const name = `${duplicates[0].firstName} ${duplicates[0].lastName}`;
    throw new Error(`Doublon probable : ${name} a déjà le même e-mail, téléphone ou WhatsApp.`);
  }

  if (input.sourceId) {
    const source = await prisma.prospectSource.findFirst({
      where: { id: input.sourceId, ...orgScope(session) },
      select: { id: true },
    });
    if (!source) {
      throw new Error("Source introuvable.");
    }
  }

  if (input.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: input.companyId, ...orgScope(session) },
      select: { id: true },
    });
    if (!company) {
      throw new Error("Entreprise introuvable.");
    }
  }

  if (input.tagIds?.length) {
    const tagCount = await prisma.tag.count({
      where: { id: { in: input.tagIds }, ...orgScope(session) },
    });
    if (tagCount !== input.tagIds.length) {
      throw new Error("Tag invalide.");
    }
  }

  const created = await prisma.prospect.create({
    data: {
      organizationId: session.organizationId,
      firstName,
      lastName,
      jobTitle: input.jobTitle,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
      city: input.city,
      country: "RD Congo",
      category: input.category,
      companyId: input.companyId,
      statusId: status.id,
      sourceId: input.sourceId,
      ownerId: input.ownerId ?? session.userId,
      priority: input.priority,
      notes: input.notes,
      score: computeProspectScore({
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp,
        companyId: input.companyId,
        jobTitle: input.jobTitle,
        priority: input.priority,
      }).score,
      tags: input.tagIds?.length
        ? { create: input.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  const scored = await refreshProspectScore(session, created.id);
  const ownerId = created.ownerId;
  if (ownerId && ownerId !== session.userId) {
    await notify({
      organizationId: session.organizationId,
      userId: ownerId,
      title: "Nouveau prospect",
      body: `${fullName(created.firstName, created.lastName)} t’a été attribué.`,
      kind: "assign",
      href: `/prospects/${created.id}`,
    });
  }

  return scored ?? created;
}

export async function updateProspectStatus(
  session: SessionPayload,
  prospectId: string,
  statusId: string,
) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, ...orgScope(session) },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }

  const status = await prisma.prospectStatus.findFirst({
    where: { id: statusId, ...orgScope(session) },
  });
  if (!status) {
    throw new Error("Statut invalide.");
  }

  const updated = await prisma.prospect.update({
    where: { id: prospect.id },
    data: {
      statusId: status.id,
      convertedAt: status.isConverted ? new Date() : prospect.convertedAt,
      lastContactAt: status.slug === "contacte" ? new Date() : prospect.lastContactAt,
    },
  });
  await refreshProspectScore(session, updated.id);
  return updated;
}

export async function updateProspectRow(
  session: SessionPayload,
  prospectId: string,
  input: {
    statusId?: string;
    notes?: string | null;
    ownerId?: string | null;
    nextContactAt?: Date | null;
  },
) {
  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, ...orgScope(session) },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }

  let statusId = prospect.statusId;
  let convertedAt = prospect.convertedAt;
  let lastContactAt = prospect.lastContactAt;
  if (input.statusId) {
    const status = await prisma.prospectStatus.findFirst({
      where: { id: input.statusId, ...orgScope(session) },
    });
    if (!status) {
      throw new Error("Statut invalide.");
    }
    statusId = status.id;
    convertedAt = status.isConverted ? new Date() : prospect.convertedAt;
    lastContactAt = status.slug === "contacte" ? new Date() : prospect.lastContactAt;
  }

  if (input.ownerId) {
    const owner = await prisma.user.findFirst({
      where: { id: input.ownerId, ...orgScope(session), isActive: true },
      select: { id: true },
    });
    if (!owner) {
      throw new Error("Commercial introuvable.");
    }
  }

  const updated = await prisma.prospect.update({
    where: { id: prospect.id },
    data: {
      statusId,
      convertedAt,
      lastContactAt,
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      ...(input.nextContactAt !== undefined ? { nextContactAt: input.nextContactAt } : {}),
    },
  });
  await refreshProspectScore(session, updated.id);
  return updated;
}
