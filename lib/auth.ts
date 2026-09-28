import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
import { isAdminRole, isDirectionRole, isSalesRole } from "@/lib/roles";
import { getSession, type SessionPayload } from "@/lib/session";

// The JWT lives 7 days: re-check the account so deactivation and role changes apply immediately.
const loadActiveUser = cache(async (userId: string, organizationId: string) =>
  prisma.user.findFirst({
    where: { id: userId, organizationId, isActive: true },
    select: { id: true, role: true, name: true, lastSeenAt: true },
  }),
);

const PRESENCE_WRITE_INTERVAL_MS = 5 * 60_000;

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  const user = await loadActiveUser(session.userId, session.organizationId);
  if (!user) {
    // Only a Route Handler may clear the cookie; /login alone would bounce back via the proxy.
    redirect("/auth/signout");
  }
  // Feeds « connectés / récemment actifs » in the sales cockpit; throttled to one write per 5 minutes.
  const lastSeen = user.lastSeenAt as Date | null;
  if (!lastSeen || Date.now() - lastSeen.getTime() > PRESENCE_WRITE_INTERVAL_MS) {
    await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  return { ...session, role: user.role, name: user.name };
}

export async function requirePermission(code: PermissionCode) {
  const session = await requireSession();
  if (!roleHasPermission(session.role, code)) {
    redirect("/");
  }
  return session;
}

export function orgScope(session: SessionPayload) {
  return { organizationId: session.organizationId };
}

export function ownedScope(session: SessionPayload) {
  return isSalesRole(session.role) ? { ownerId: session.userId } : {};
}

export function isDirectorRole(role: SessionPayload["role"]) {
  return isDirectionRole(role);
}

export async function requireDirector() {
  const session = await requireSession();
  if (session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (!isDirectorRole(session.role)) {
    redirect("/interface");
  }
  return session;
}

export async function requireCommercial() {
  const session = await requireSession();
  if (session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (!isSalesRole(session.role) && !isAdminRole(session.role)) {
    redirect("/direction");
  }
  return session;
}
