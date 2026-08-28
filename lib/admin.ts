import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";

export async function listSaaSOrganizations(session: SessionPayload) {
  if (!roleHasPermission(session.role, PERMISSIONS.saasAdmin)) {
    return [];
  }

  return prisma.organization.findMany({
    include: {
      _count: {
        select: { users: true, prospects: true, companies: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
