import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope, ownedScope } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";
import { nextDisplayCode } from "@/lib/status-history";

export async function listCompanies(session: SessionPayload, query?: string) {
  const q = query?.trim();
  return prisma.company.findMany({
    where: {
      ...orgScope(session),
      ...ownedScope(session),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { contacts: true, prospects: true } },
    },
    orderBy: { name: "asc" },
    take: 80,
  });
}

export async function findCompanyByName(session: SessionPayload, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  return prisma.company.findFirst({
    where: {
      ...orgScope(session),
      name: { equals: trimmed, mode: "insensitive" },
    },
    include: {
      prospects: { select: { id: true }, take: 1 },
    },
  });
}

export async function getCompany(session: SessionPayload, id: string) {
  return prisma.company.findFirst({
    where: { id, ...orgScope(session) },
    include: {
      owner: { select: { id: true, name: true } },
      contacts: { orderBy: { lastName: "asc" } },
      prospects: {
        include: { status: true, owner: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function createCompany(
  session: SessionPayload,
  input: {
    name: string;
    industry?: string;
    website?: string;
    email?: string;
    phone?: string;
    city?: string;
    address?: string;
    size?: string;
    notes?: string;
    ownerId?: string;
  },
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Le nom de l’entreprise est requis.");
  }

  const duplicate = await findCompanyByName(session, name);
  if (duplicate) {
    throw new Error(`Cette entreprise existe déjà : ${duplicate.name}. Recherchez-la dans le formulaire.`);
  }

  return prisma.company.create({
    data: {
      organizationId: session.organizationId,
      displayCode: await nextDisplayCode(session.organizationId, "ENT"),
      ownerId: input.ownerId ?? session.userId,
      name,
      industry: input.industry,
      website: input.website,
      email: input.email,
      phone: input.phone,
      country: "RD Congo",
      city: input.city,
      address: input.address,
      size: input.size,
      notes: input.notes,
    },
  });
}
