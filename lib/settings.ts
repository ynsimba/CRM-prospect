import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { orgScope } from "@/lib/auth";

export async function getOrganizationSettings(session: SessionPayload) {
  return prisma.organization.findFirst({
    where: { id: session.organizationId },
  });
}

export async function updateOrganizationSettings(
  session: SessionPayload,
  input: { name: string; phone: string; website: string; currency: string; timezone: string },
) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Le nom de l’organisation est requis.");
  }

  return prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      name,
      phone: input.phone.trim() || null,
      website: input.website.trim() || null,
      currency: input.currency.trim() || "CDF",
      timezone: input.timezone.trim() || "Africa/Kinshasa",
    },
  });
}

export async function listTeams(session: SessionPayload) {
  return prisma.team.findMany({
    where: orgScope(session),
    orderBy: { name: "asc" },
  });
}
