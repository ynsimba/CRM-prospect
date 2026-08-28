import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

export async function listCompanies(session: SessionPayload, query?: string) {
  const q = query?.trim();
  return prisma.company.findMany({
    where: {
      ...orgScope(session),
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

  return prisma.company.create({
    data: {
      organizationId: session.organizationId,
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
