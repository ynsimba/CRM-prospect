import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope } from "@/lib/auth";
import { slugify } from "@/lib/crm";
import type { SessionPayload } from "@/lib/session";

export async function createStatus(session: SessionPayload, name: string) {
  const label = name.trim();
  const slug = slugify(label);
  if (!label || !slug) {
    throw new Error("Le nom du statut est requis.");
  }

  const last = await prisma.prospectStatus.findFirst({
    where: orgScope(session),
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  return prisma.prospectStatus.create({
    data: {
      organizationId: session.organizationId,
      name: label,
      slug,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });
}

export async function createSource(session: SessionPayload, name: string) {
  const label = name.trim();
  const slug = slugify(label);
  if (!label || !slug) {
    throw new Error("Le nom de la source est requis.");
  }

  return prisma.prospectSource.create({
    data: {
      organizationId: session.organizationId,
      name: label,
      slug,
    },
  });
}

export async function createTag(session: SessionPayload, name: string) {
  const label = name.trim();
  if (!label) {
    throw new Error("Le nom du tag est requis.");
  }

  return prisma.tag.create({
    data: {
      organizationId: session.organizationId,
      name: label,
    },
  });
}
