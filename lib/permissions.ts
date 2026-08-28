import type { Role } from "@prisma/client";

export const PERMISSIONS = {
  dashboardRead: "dashboard.read",
  prospectsRead: "prospects.read",
  prospectsManage: "prospects.manage",
  companiesRead: "companies.read",
  companiesManage: "companies.manage",
  pipelineRead: "pipeline.read",
  pipelineManage: "pipeline.manage",
  activitiesRead: "activities.read",
  activitiesManage: "activities.manage",
  teamRead: "team.read",
  campaignsManage: "campaigns.manage",
  reportsRead: "reports.read",
  usersManage: "users.manage",
  settingsManage: "settings.manage",
  saasAdmin: "saas.admin",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ALL_PERMISSIONS: { code: PermissionCode; label: string }[] = [
  { code: PERMISSIONS.dashboardRead, label: "Voir le tableau de bord" },
  { code: PERMISSIONS.prospectsRead, label: "Consulter les prospects" },
  { code: PERMISSIONS.prospectsManage, label: "Gérer les prospects" },
  { code: PERMISSIONS.companiesRead, label: "Consulter les entreprises" },
  { code: PERMISSIONS.companiesManage, label: "Gérer les entreprises" },
  { code: PERMISSIONS.pipelineRead, label: "Consulter le pipeline" },
  { code: PERMISSIONS.pipelineManage, label: "Gérer le pipeline" },
  { code: PERMISSIONS.activitiesRead, label: "Consulter les activités" },
  { code: PERMISSIONS.activitiesManage, label: "Gérer les activités" },
  { code: PERMISSIONS.teamRead, label: "Consulter l’équipe" },
  { code: PERMISSIONS.campaignsManage, label: "Gérer les campagnes" },
  { code: PERMISSIONS.reportsRead, label: "Consulter les rapports" },
  { code: PERMISSIONS.usersManage, label: "Gérer les utilisateurs" },
  { code: PERMISSIONS.settingsManage, label: "Gérer les paramètres" },
  { code: PERMISSIONS.saasAdmin, label: "Administration SaaS" },
];

const COMMERCIAL: PermissionCode[] = [
  PERMISSIONS.dashboardRead,
  PERMISSIONS.prospectsRead,
  PERMISSIONS.prospectsManage,
  PERMISSIONS.companiesRead,
  PERMISSIONS.companiesManage,
  PERMISSIONS.pipelineRead,
  PERMISSIONS.pipelineManage,
  PERMISSIONS.activitiesRead,
  PERMISSIONS.activitiesManage,
  PERMISSIONS.teamRead,
  PERMISSIONS.reportsRead,
];

const ROLE_PERMISSIONS: Record<Role, PermissionCode[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS.map((item) => item.code),
  OWNER: ALL_PERMISSIONS.map((item) => item.code).filter((code) => code !== PERMISSIONS.saasAdmin),
  MANAGER: [
    ...COMMERCIAL,
    PERMISSIONS.campaignsManage,
    PERMISSIONS.usersManage,
    PERMISSIONS.settingsManage,
  ],
  SALES: COMMERCIAL,
};

export function getAllPermissions() {
  return ALL_PERMISSIONS;
}

export function getPermissionsForRole(role: Role) {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: Role, code: PermissionCode) {
  return ROLE_PERMISSIONS[role].includes(code);
}
