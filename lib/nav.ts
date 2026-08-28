import type { Role } from "@prisma/client";
import { PERMISSIONS, roleHasPermission, type PermissionCode } from "@/lib/permissions";

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
  { href: "/archives", icon: "bi-archive", label: "Archives" },
];

const ADMIN_HREFS = new Set(["/admin", "/parametres"]);

export function visibleNav(items: NavItem[], role?: Role) {
  if (!role) return items;
  if (role === "SUPER_ADMIN") {
    return items.filter((item) => ADMIN_HREFS.has(item.href));
  }
  return items.filter((item) => !item.permission || roleHasPermission(role, item.permission));
}

export function navForRole(role?: Role) {
  if (role === "SALES") {
    return { main: SALES_NAV, config: [] as NavItem[] };
  }
  return { main: visibleNav(MAIN_NAV, role), config: visibleNav(CONFIG_NAV, role) };
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
