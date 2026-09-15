import type { Role } from "@prisma/client";

/** Rôles utilisateurs de l’app. SUPER_ADMIN reste interne (console SaaS). */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  OWNER: "Admin",
  MANAGER: "Direction",
  SALES: "Délégué commercial",
};

export const PROFILE_ROLE_LABELS = ROLE_LABELS;

export const ASSIGNABLE_ROLES: Role[] = ["OWNER", "MANAGER", "SALES"];

export function isAdminRole(role?: Role) {
  return role === "OWNER";
}

export function isDirectionRole(role?: Role) {
  return role === "OWNER" || role === "MANAGER";
}

export function isSalesRole(role?: Role) {
  return role === "SALES";
}

export function homePathForRole(role: Role) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "MANAGER") return "/direction";
  return "/";
}
