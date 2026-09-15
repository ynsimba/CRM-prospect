import "server-only";

import { prisma } from "@/lib/prisma";
import { orgScope, ownedScope } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

export async function getCrmOptions(session: SessionPayload) {
  const scope = orgScope(session);
  const [statuses, sources, tags, companies, owners] = await Promise.all([
    prisma.prospectStatus.findMany({ where: scope, orderBy: { sortOrder: "asc" } }),
    prisma.prospectSource.findMany({ where: scope, orderBy: { name: "asc" } }),
    prisma.tag.findMany({ where: scope, orderBy: { name: "asc" } }),
    prisma.company.findMany({
      where: { ...scope, ...ownedScope(session) },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { ...scope, isActive: true, role: { not: "SUPER_ADMIN" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { statuses, sources, tags, companies, owners };
}
