import type { Role } from "@prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  OWNER: "Admin",
  MANAGER: "Manager",
  SALES: "Commercial",
};

export const PROFILE_ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  OWNER: "Admin",
  MANAGER: "Manager",
  SALES: "Déléguée commerciale",
};

export const ASSIGNABLE_ROLES: Role[] = ["OWNER", "MANAGER", "SALES"];
