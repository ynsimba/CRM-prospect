import type { Role } from "@/lib/enums";

/** Rôles utilisateurs de l’app. Le super admin a les droits admin, plus le journal et les comptes. */
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  OWNER: "Admin",
  MANAGER: "Direction",
  TEAM_LEAD: "Responsable commercial",
  SALES: "Délégué commercial",
};

export const PROFILE_ROLE_LABELS = ROLE_LABELS;

export const ASSIGNABLE_ROLES: Role[] = ["OWNER", "MANAGER", "TEAM_LEAD", "SALES"];

/** Roles that carry a prospect portfolio and appear in the « Agents commerciaux » module. */
export const AGENT_ROLES: Role[] = ["SALES", "TEAM_LEAD"];

export function isAdminRole(role?: Role) {
  return role === "OWNER" || role === "SUPER_ADMIN";
}

export function isDirectionRole(role?: Role) {
  return role === "OWNER" || role === "MANAGER" || role === "SUPER_ADMIN";
}

/** A team lead sells too: in the commercial workspace they only see their own portfolio. */
export function isSalesRole(role?: Role) {
  return role === "SALES" || role === "TEAM_LEAD";
}

export function isAgentRole(role?: Role) {
  return role === "SALES" || role === "TEAM_LEAD";
}

/** Who may open the « Agents commerciaux » cockpit. Team leads are scoped to their own team. */
export function canManageAgents(role?: Role) {
  return role === "OWNER" || role === "SUPER_ADMIN" || role === "MANAGER" || role === "TEAM_LEAD";
}

export function homePathForRole(role: Role) {
  if (role === "MANAGER") return "/direction";
  return "/";
}
