"use client";

import { useState, type CSSProperties } from "react";
import type { Role } from "@/lib/enums";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { initialsFromName } from "@/lib/crm";
import { ROLE_LABELS } from "@/lib/roles";
import {
  COMMERCIAL_NAV,
  DIRECTION_NAV,
  extraMainNav,
  isCommercialSectionActive,
  isDirectionSectionActive,
  isNavActive,
  navForRole,
  showCommercialModule,
  showDirectionModule,
  visibleSidebarModules,
} from "@/lib/nav";

type SidebarProps = {
  open: boolean;
  activeHref: string;
  role?: Role;
  userName?: string;
  unreadCount?: number;
  darkMode: boolean;
  onToggleTheme: () => void;
  onHide: () => void;
  onNavigate: () => void;
};

export default function Sidebar({
  open,
  activeHref,
  role,
  userName = "",
  unreadCount = 0,
  darkMode,
  onToggleTheme,
  onHide,
  onNavigate,
}: SidebarProps) {
  const { config: configItems } = navForRole(role);
  const extraItems = extraMainNav(role);
  const modules = visibleSidebarModules(role);
  const commercialActive = isCommercialSectionActive(activeHref);
  const directionActive = isDirectionSectionActive(activeHref);
  const [commercialOpen, setCommercialOpen] = useState(true);
  const [directionOpen, setDirectionOpen] = useState(true);
  const initials = initialsFromName(userName) || "PC";

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">
        <Image
          src="/logo.png"
          alt="Safecheck RDC"
          className="sidebar-brand"
          width={1495}
          height={494}
          sizes="200px"
          loading="eager"
        />
        <button
          type="button"
          className="sidebar-hide"
          aria-label="Masquer le menu"
          onClick={onHide}
        >
          <i className="bi bi-chevron-double-left" aria-hidden />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {showCommercialModule(role) ? (
          <div className={`nav-module ${commercialOpen ? "is-open" : ""} ${commercialActive ? "is-current" : ""}`}>
            <button
              type="button"
              className="nav-module-toggle"
              aria-expanded={commercialOpen}
              onClick={() => setCommercialOpen((value) => !value)}
            >
              <i className="bi bi-cart3" aria-hidden />
              Interface Commerciale
              <i className={`bi ${commercialOpen ? "bi-chevron-down" : "bi-chevron-right"} nav-module-caret`} aria-hidden />
            </button>
            {commercialOpen ? (
              <div className="nav-module-items">
                {COMMERCIAL_NAV.map((item, index) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={`nav-link-item nested ${isNavActive(item.href, activeHref, COMMERCIAL_NAV) ? "active" : ""}`}
                    style={{ "--i": index } as CSSProperties}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {showDirectionModule(role) ? (
          <div className={`nav-module ${directionOpen ? "is-open" : ""} ${directionActive ? "is-current" : ""}`}>
            <button
              type="button"
              className="nav-module-toggle"
              aria-expanded={directionOpen}
              onClick={() => setDirectionOpen((value) => !value)}
            >
              <i className="bi bi-check2-square" aria-hidden />
              Interface Direction
              <i className={`bi ${directionOpen ? "bi-chevron-down" : "bi-chevron-right"} nav-module-caret`} aria-hidden />
            </button>
            {directionOpen ? (
              <div className="nav-module-items">
                {DIRECTION_NAV.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link-item nested ${isNavActive(item.href, activeHref, DIRECTION_NAV) ? "active" : ""}`}
                    style={{ "--i": index } as CSSProperties}
                    onClick={onNavigate}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {modules.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-link-item module-link ${isNavActive(item.href, activeHref, modules) ? "active" : ""}`}
            onClick={onNavigate}
          >
            <i className={`bi ${item.icon}`} aria-hidden />
            {item.label}
          </Link>
        ))}

        {extraItems.map((item, index) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-link-item ${isNavActive(item.href, activeHref, extraItems) ? "active" : ""}`}
            style={{ "--i": index } as CSSProperties}
            onClick={onNavigate}
          >
            <i className={`bi ${item.icon}`} aria-hidden />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-config">
        <p className="sidebar-config-title">Configuration</p>
        <div className="config-card">
          <div className="mode-row">
            <span>
              <i className={`bi ${darkMode ? "bi-moon-stars" : "bi-sun"}`} aria-hidden />
              {darkMode ? "Mode sombre" : "Mode clair"}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={onToggleTheme}
                aria-label={darkMode ? "Désactiver le mode sombre" : "Activer le mode sombre"}
              />
              <span className="slider" />
            </label>
          </div>

          {configItems.length > 0 ? (
            configItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}-${item.icon}`}
                href={item.href}
                className={`nav-link-item ${isNavActive(item.href, activeHref, configItems) ? "active" : ""}`}
                onClick={onNavigate}
              >
                <i className={`bi ${item.icon}`} aria-hidden />
                {item.label}
              </Link>
            ))
          ) : null}
        </div>
      </div>

      <div className="sidebar-footer">
        <form action={logoutAction}>
          <button type="submit" className="btn-logout">
            <i className="bi bi-box-arrow-right" aria-hidden />
            Déconnexion
          </button>
        </form>
        <div className="sidebar-user">
          <span className="sidebar-avatar" title={userName || "Compte"} aria-hidden>
            {initials}
          </span>
          <div className="sidebar-user-meta">
            <span className="sidebar-user-name">{userName || "Compte"}</span>
            <span className="sidebar-user-role">{role ? ROLE_LABELS[role] : "Utilisateur"}</span>
          </div>
          <Link
            href="/notifications"
            className="sidebar-dock-bell"
            onClick={onNavigate}
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications"}
          >
            <i className="bi bi-bell" aria-hidden />
            {unreadCount > 0 ? (
              <span className="notif-badge dock">{unreadCount > 99 ? "99+" : unreadCount}</span>
            ) : null}
          </Link>
        </div>
      </div>
    </aside>
  );
}
