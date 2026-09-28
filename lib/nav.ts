import type { Role } from "@/lib/enums";
import { PERMISSIONS, roleHasPermission, type PermissionCode } from "@/lib/permissions";
import { isAdminRole, isDirectionRole, isSalesRole } from "@/lib/roles";

export type NavItem = {
  href: string;
  icon: string;
  label: string;
  permission?: PermissionCode;
};

export const MAIN_NAV: NavItem[] = [
  { href: "/", icon: "bi-house", label: "Tableau de bord", permission: PERMISSIONS.dashboardRead },
  { href: "/admin", icon: "bi-shield-check", label: "Admin SaaS", permission: PERMISSIONS.saasAdmin },
  { href: "/prospects", icon: "bi-person-lines-fill", label: "Prospects", permission: PERMISSIONS.prospectsRead },
  { href: "/pipeline", icon: "bi-kanban", label: "Pipeline", permission: PERMISSIONS.pipelineRead },
  { href: "/rapports", icon: "bi-activity", label: "Rapports", permission: PERMISSIONS.reportsRead },
  { href: "/parametres", icon: "bi-gear", label: "Paramètres" },
];

export const CONFIG_NAV: NavItem[] = [
  { href: "/entreprises", icon: "bi-building", label: "Entreprises", permission: PERMISSIONS.companiesRead },
  { href: "/contacts", icon: "bi-people", label: "Contacts", permission: PERMISSIONS.companiesRead },
  { href: "/import", icon: "bi-upload", label: "Import CSV", permission: PERMISSIONS.prospectsManage },
  { href: "/taches", icon: "bi-check2-square", label: "Tâches", permission: PERMISSIONS.activitiesRead },
  { href: "/relances", icon: "bi-alarm", label: "Relances", permission: PERMISSIONS.activitiesRead },
  { href: "/equipe", icon: "bi-person-badge", label: "Équipe", permission: PERMISSIONS.teamRead },
  { href: "/utilisateurs", icon: "bi-person-gear", label: "Utilisateurs", permission: PERMISSIONS.usersManage },
  { href: "/campagnes", icon: "bi-megaphone", label: "Campagnes", permission: PERMISSIONS.campaignsManage },
  { href: "/journal", icon: "bi-journal-text", label: "Journal", permission: PERMISSIONS.settingsManage },
];

export const SALES_NAV: NavItem[] = [
  { href: "/", icon: "bi-house", label: "Tableau de bord" },
  { href: "/prospects", icon: "bi-people", label: "Tous les prospects" },
  { href: "/contacts/nouveau", icon: "bi-person-plus", label: "Ajouter contact" },
  { href: "/prospects/nouveau", icon: "bi-person-plus-fill", label: "Ajouter un prospect" },
  { href: "/suivi", icon: "bi-eye", label: "Suivi prospect" },
  { href: "/taches", icon: "bi-check2-square", label: "Mes tâches" },
  { href: "/notes", icon: "bi-journal-richtext", label: "Mes notes" },
  { href: "/archives", icon: "bi-archive", label: "Archives" },
];

export const COMMERCIAL_NAV = SALES_NAV;

export const DIRECTION_NAV: NavItem[] = [
  { href: "/direction", icon: "bi-speedometer2", label: "Tableau de bord" },
  { href: "/direction/prospects", icon: "bi-people", label: "Tous les Prospect" },
  { href: "/direction/agents/liste", icon: "bi-person-vcard", label: "Agents commerciaux" },
  { href: "/direction/assignation", icon: "bi-person-check", label: "Assignation Tâches" },
  { href: "/direction/taches", icon: "bi-list-check", label: "Suivie des tâches" },
  { href: "/direction/taches/departement", icon: "bi-diagram-3", label: "Tâches par département" },
  { href: "/direction/taches/archives", icon: "bi-archive", label: "Archives Task par département" },
  { href: "/direction/archives", icon: "bi-archive-fill", label: "Archive Prospect" },
];

export const SIDEBAR_MODULES: NavItem[] = [
  { href: "/taches", icon: "bi-bullseye", label: "Mes Tâches" },
  { href: "/notes", icon: "bi-journal-text", label: "Mes notes" },
  { href: "/notifications", icon: "bi-chat-dots", label: "Fil de Discussion" },
];

const COMMERCIAL_HREFS = new Set(COMMERCIAL_NAV.map((item) => item.href));
const DIRECTION_HREFS = new Set(DIRECTION_NAV.map((item) => item.href));
const MODULE_HREFS = new Set(SIDEBAR_MODULES.map((item) => item.href));

const ADMIN_HREFS = new Set(["/admin", "/parametres"]);

export function visibleNav(items: NavItem[], role?: Role) {
  if (!role) return items;
  if (role === "SUPER_ADMIN") {
    return items.filter((item) => ADMIN_HREFS.has(item.href));
  }
  return items.filter((item) => !item.permission || roleHasPermission(role, item.permission));
}

export function navForRole(role?: Role) {
  if (isSalesRole(role)) {
    return { main: SALES_NAV, config: [] as NavItem[] };
  }
  if (role === "MANAGER") {
    return { main: DIRECTION_NAV, config: [] as NavItem[] };
  }
  return { main: visibleNav(MAIN_NAV, role), config: visibleNav(CONFIG_NAV, role) };
}

export function extraMainNav(role?: Role) {
  return navForRole(role).main.filter(
    (item) => !COMMERCIAL_HREFS.has(item.href) && !DIRECTION_HREFS.has(item.href) && !MODULE_HREFS.has(item.href),
  );
}

/** Team leads manage their own team from the « Agents commerciaux » cockpit. */
export const TEAM_LEAD_MODULE: NavItem = {
  href: "/direction/agents/liste",
  icon: "bi-people-fill",
  label: "Mon équipe commerciale",
};

export function visibleSidebarModules(role?: Role) {
  if (isDirectionRole(role) && !isAdminRole(role) && !isSalesRole(role)) {
    return SIDEBAR_MODULES.filter((item) => item.href === "/notifications");
  }
  if (role === "TEAM_LEAD") return [TEAM_LEAD_MODULE, ...SIDEBAR_MODULES];
  return SIDEBAR_MODULES;
}

export function showCommercialModule(role?: Role) {
  return isSalesRole(role) || isAdminRole(role);
}

export function showDirectionModule(role?: Role) {
  return isDirectionRole(role);
}

export function isCommercialSectionActive(activeHref: string) {
  return COMMERCIAL_NAV.some((item) => isNavActive(item.href, activeHref, COMMERCIAL_NAV));
}

export function isDirectionSectionActive(activeHref: string) {
  return DIRECTION_NAV.some((item) => isNavActive(item.href, activeHref, DIRECTION_NAV));
}

export function isNavActive(href: string, activeHref: string, items: NavItem[]) {
  if (href === "/") return activeHref === "/";
  const hrefs = items.map((item) => item.href).filter((item) => item !== "/");
  const matches = hrefs.filter((item) => activeHref === item || activeHref.startsWith(`${item}/`));
  if (matches.length === 0) {
    return activeHref === href || activeHref.startsWith(`${href}/`);
  }
  return matches.sort((a, b) => b.length - a.length)[0] === href;
}
