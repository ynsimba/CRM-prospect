import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

export async function listContacts(session: SessionPayload, query?: string) {
  const q = query?.trim();
  return prisma.contact.findMany({
    where: {
      ...orgScope(session),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { whatsapp: { contains: q, mode: "insensitive" } },
              { company: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      company: { select: { id: true, name: true } },
      owner: { select: { name: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 80,
  });
}

export async function getContact(session: SessionPayload, id: string) {
  return prisma.contact.findFirst({
    where: { id, ...orgScope(session) },
    include: {
      company: true,
      owner: { select: { name: true } },
      prospects: { include: { status: true } },
    },
  });
}

export async function createContact(
  session: SessionPayload,
  input: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    linkedin?: string;
    category?: string;
    companyId?: string;
    notes?: string;
  },
) {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!firstName || !lastName) {
    throw new Error("Le prénom et le nom sont requis.");
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

  return prisma.contact.create({
    data: {
      organizationId: session.organizationId,
      ownerId: session.userId,
      firstName,
      lastName,
      jobTitle: input.jobTitle,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
      linkedin: input.linkedin,
      category: input.category,
      companyId: input.companyId,
      notes: input.notes,
    },
  });
}
