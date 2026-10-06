import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
import { isAdminRole, isDirectionRole, isSalesRole } from "@/lib/roles";
import { getSession, type SessionPayload } from "@/lib/session";
import { isSessionIdle } from "@/lib/session-policy";

const loadActiveUser = cache(async (userId: string, organizationId: string) =>
  prisma.user.findFirst({
    where: { id: userId, organizationId, isActive: true },
    select: {
      id: true,
      role: true,
      name: true,
      lastSeenAt: true,
      photoUrl: true,
      civility: true,
      sessionToken: true,
    },
  }),
);

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  // Cookie absent/incomplet : passer par signout pour le purger (évite / ↔ /login en boucle).
  if (!session?.userId || !session.sessionToken) {
    redirect("/auth/signout");
  }

  const user = await loadActiveUser(session.userId, session.organizationId);
  if (!user) {
    redirect("/auth/signout");
  }

  // Une seule session active : une nouvelle connexion invalide les supports précédents.
  if (!user.sessionToken || user.sessionToken !== session.sessionToken) {
    redirect("/auth/signout");
  }

  // Expiration après 15 minutes sans activité (heartbeat / login).
  if (isSessionIdle(user.lastSeenAt as Date | null)) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: { sessionToken: null },
      })
      .catch(() => undefined);
    redirect("/auth/signout");
  }

  return {
    ...session,
    role: user.role,
    name: user.name,
    photoUrl: (user.photoUrl as string | null) ?? null,
    civility: (user.civility as string | null) ?? null,
  };
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
  if (!isDirectorRole(session.role)) {
    redirect("/interface");
  }
  return session;
}

export async function requireCommercial() {
  const session = await requireSession();
  if (!isSalesRole(session.role) && !isAdminRole(session.role)) {
    redirect("/direction");
  }
  return session;
}

/** Commerciaux, admins et direction (notes partagées). */
export async function requireNotesAccess() {
  const session = await requireSession();
  if (!isSalesRole(session.role) && !isAdminRole(session.role) && session.role !== "MANAGER") {
    redirect("/");
  }
  return session;
}
