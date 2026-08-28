import "server-only";

import { redirect } from "next/navigation";
import type { PermissionCode } from "@/lib/permissions";
import { roleHasPermission } from "@/lib/permissions";
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
