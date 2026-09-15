import "server-only";

import { redirect } from "next/navigation";
import type { PermissionCode } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
import { isAdminRole, isDirectionRole, isSalesRole } from "@/lib/roles";
import { getSession, type SessionPayload } from "@/lib/session";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
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
