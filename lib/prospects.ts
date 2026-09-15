import "server-only";

import { ProspectPriority, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { orgScope, ownedScope } from "@/lib/auth";
import { computeProspectScore, fullName, type ProspectFilters } from "@/lib/crm";
import { resolveProspectOwnerScope } from "@/lib/prospect-list-logic";
import { notify } from "@/lib/notifications";
import { refreshProspectScore } from "@/lib/scoring";
import type { SessionPayload } from "@/lib/session";
import { archivedWhere, notArchivedWhere } from "@/lib/safecheck";
import { findCompanyByName } from "@/lib/companies";
import { nextDisplayCode, notifyDirectorsOfFinalStatus, recordStatusHistory } from "@/lib/status-history";

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
    extra.push(archivedWhere());
  } else if (filters.archived === false) {
    extra.push(notArchivedWhere());
  }
  if (filters.followUp) {
    extra.push({
      status: { isConverted: false, isLost: false },
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
      ...resolveProspectOwnerScope(session, filters),
      ...(filters.statusId ? { statusId: filters.statusId } : {}),
      ...(filters.sourceId ? { sourceId: filters.sourceId } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
      ...(filters.tagId ? { tags: { some: { tagId: filters.tagId } } } : {}),
      ...(scoreWhere(filters.score) ? { score: scoreWhere(filters.score) } : {}),
      ...(extra.length === 1 ? extra[0] : extra.length > 1 ? { AND: extra } : {}),
    },
    include: {
      company: { select: { id: true, name: true, industry: true, address: true, city: true, size: true, displayCode: true } },
      status: true,
      source: true,
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      activities: { select: { occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 1 },
    },
    orderBy: prospectOrderBy(filters.sort),
    take: 200,
  });
}

export async function getProspect(session: SessionPayload, id: string) {
  return prisma.prospect.findFirst({
    where: { id, ...orgScope(session), ...ownedScope(session) },
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
      statusHistory: {
        include: { actor: { select: { name: true } } },
        orderBy: { occurredAt: "desc" },
        take: 40,
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
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    city?: string;
    address?: string;
    industry?: string;
    companySize?: string;
    category?: string;
    civility?: string;
    companyId?: string;
    companyName?: string;
    statusId: string;
    sourceId?: string;
    ownerId?: string;
    priority: ProspectPriority;
    notes?: string;
    statusComment?: string;
    tagIds?: string[];
    firstContactAt?: Date;
    nextContactAt?: Date;
  },
) {
  if (session.role === "SALES") {
    input.ownerId = session.userId;
  }

  const companyName = input.companyName?.trim();
  let companyId = input.companyId;
  let displayCode: string | undefined;

  if (companyId) {
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...orgScope(session) },
      select: { id: true, name: true, displayCode: true, prospects: { select: { id: true }, take: 1 } },
    });
    if (!company) {
      throw new Error("Entreprise introuvable.");
    }
    if (company.prospects.length > 0) {
      throw new Error(`Cette entreprise existe déjà : ${company.name}. Ouvrez la fiche existante.`);
    }
    displayCode = company.displayCode ?? undefined;
  } else if (companyName) {
    const duplicate = await findCompanyByName(session, companyName);
    if (duplicate) {
      throw new Error(`Cette entreprise existe déjà : ${duplicate.name}. Recherchez-la dans le formulaire.`);
    }
    displayCode = await nextDisplayCode(session.organizationId, "ENT");
    const company = await prisma.company.create({
      data: {
        organizationId: session.organizationId,
        displayCode,
        ownerId: input.ownerId ?? session.userId,
        name: companyName,
        industry: input.industry,
        city: input.city,
        address: input.address,
        size: input.companySize,
        country: "RD Congo",
      },
    });
    companyId = company.id;
  }

  const firstName = input.firstName?.trim() || companyName || "";
  const lastName = input.lastName?.trim() || (companyName ? "—" : "");
  if (!firstName || !lastName) {
    throw new Error("Le nom de l’entreprise est requis.");
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

  if (input.tagIds?.length) {
    const tagCount = await prisma.tag.count({
      where: { id: { in: input.tagIds }, ...orgScope(session) },
    });
    if (tagCount !== input.tagIds.length) {
      throw new Error("Tag invalide.");
    }
  }

  let contactId: string | undefined;
  if (companyId && input.firstName?.trim() && input.lastName?.trim()) {
    const contact = await prisma.contact.create({
      data: {
        organizationId: session.organizationId,
        displayCode: await nextDisplayCode(session.organizationId, "CTC"),
        ownerId: session.userId,
        companyId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        civility: input.civility,
        jobTitle: input.jobTitle,
        email: input.email,
        phone: input.phone,
        category: input.category ?? "contact",
      },
    });
    contactId = contact.id;
  }

  const now = new Date();
  const created = await prisma.prospect.create({
    data: {
      organizationId: session.organizationId,
      displayCode: displayCode ?? (await nextDisplayCode(session.organizationId, "ENT")),
      firstName,
      lastName,
      jobTitle: input.jobTitle,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
      city: input.city,
      address: input.address,
      industry: input.industry,
      companySize: input.companySize,
      country: "RD Congo",
      category: input.category,
      companyId,
      contactId,
      statusId: status.id,
      statusComment: input.statusComment,
      sourceId: input.sourceId,
      ownerId: session.role === "SALES" ? session.userId : (input.ownerId ?? session.userId),
      priority: input.priority,
      notes: input.notes,
      lastActionAt: now,
      firstContactAt: input.firstContactAt ?? (status.slug === "opportunite" ? null : now),
      nextContactAt: input.nextContactAt,
      score: computeProspectScore({
        email: input.email,
        phone: input.phone,
        whatsapp: input.whatsapp,
        companyId,
        jobTitle: input.jobTitle,
        priority: input.priority,
        statusSlug: status.slug,
      }).score,
      tags: input.tagIds?.length
        ? { create: input.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });

  await recordStatusHistory({
    organizationId: session.organizationId,
    prospectId: created.id,
    statusId: status.id,
    statusName: status.name,
    statusSlug: status.slug,
    actorId: session.userId,
    comment: input.statusComment ?? input.notes,
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
  statusComment?: string | null,
) {
  return updateProspectRow(session, prospectId, { statusId, statusComment });
}

export async function updateProspectRow(
  session: SessionPayload,
  prospectId: string,
  input: {
    statusId?: string;
    notes?: string | null;
    statusComment?: string | null;
    ownerId?: string | null;
    nextContactAt?: Date | null;
  },
) {
  const prospect = await prisma.prospect.findFirst({
    where: {
      id: prospectId,
      ...orgScope(session),
      ...ownedScope(session),
    },
    include: { status: true, owner: { select: { name: true } } },
  });
  if (!prospect) {
    throw new Error("Prospect introuvable.");
  }

  if (session.role === "SALES" && input.ownerId !== undefined && input.ownerId !== session.userId) {
    throw new Error("Seul le directeur peut réassigner un prospect.");
  }

  let status = prospect.status;
  if (input.statusId && input.statusId !== prospect.statusId) {
    const next = await prisma.prospectStatus.findFirst({
      where: { id: input.statusId, ...orgScope(session) },
    });
    if (!next) {
      throw new Error("Statut invalide.");
    }
    status = next;
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

  const now = new Date();
  const statusChanged = status.id !== prospect.statusId;
  const commentChanged =
    input.statusComment !== undefined && input.statusComment !== prospect.statusComment;
  const nextComment = input.statusComment !== undefined ? input.statusComment : prospect.statusComment;
  const touchAction = statusChanged || commentChanged;

  const updated = await prisma.prospect.update({
    where: { id: prospect.id },
    data: {
      statusId: status.id,
      convertedAt: status.isConverted ? now : prospect.convertedAt,
      lastContactAt: status.slug === "lead" || status.slug === "pipeline" ? now : prospect.lastContactAt,
      firstContactAt:
        prospect.firstContactAt ??
        (status.slug !== "opportunite" ? now : prospect.firstContactAt),
      lastActionAt: touchAction ? now : prospect.lastActionAt,
      ...(input.statusComment !== undefined ? { statusComment: input.statusComment } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.ownerId !== undefined ? { ownerId: input.ownerId } : {}),
      ...(input.nextContactAt !== undefined ? { nextContactAt: input.nextContactAt } : {}),
    },
    include: { owner: { select: { name: true } } },
  });

  if (statusChanged || commentChanged) {
    await recordStatusHistory({
      organizationId: session.organizationId,
      prospectId: prospect.id,
      statusId: status.id,
      statusName: status.name,
      statusSlug: status.slug,
      actorId: session.userId,
      comment: nextComment,
    });
  }

  if (statusChanged && (status.isConverted || status.isLost)) {
    await notifyDirectorsOfFinalStatus({
      session,
      prospect: updated,
      statusName: status.name,
      comment: nextComment,
      ownerName: updated.owner?.name,
    });
  }

  await refreshProspectScore(session, updated.id);
  return updated;
}
