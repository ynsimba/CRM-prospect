"use client";

import { useState, type CSSProperties } from "react";
import type { Role } from "@/lib/enums";
import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { homePathForRole } from "@/lib/roles";
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
  initials?: string;
  roleLabel?: string;
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
  initials = "PC",
  roleLabel = "Utilisateur",
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
  const homeHref = role ? homePathForRole(role) : "/";
  // « Tableau de bord » est sorti des modules : il ouvre le menu, comme lien d’accueil.
  const commercialItems = COMMERCIAL_NAV.filter((item) => item.href !== homeHref);
  const directionItems = DIRECTION_NAV.filter((item) => item.href !== homeHref);

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">
        <Link
          href={homeHref}
          className="sidebar-brand-link"
          aria-label="Retour au tableau de bord"
          onClick={onNavigate}
        >
          <Image
            src="/logo.png"
            alt="Safecheck RDC"
            className="sidebar-brand"
            width={1495}
            height={494}
            sizes="200px"
            loading="eager"
          />
        </Link>
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
        <Link
          href={homeHref}
          className={`nav-link-item nav-home ${activeHref === homeHref ? "active" : ""}`}
          aria-current={activeHref === homeHref ? "page" : undefined}
          onClick={onNavigate}
        >
          <i className="bi bi-house-door-fill" aria-hidden />
          Tableau de bord
        </Link>

        {showCommercialModule(role) ? (
          <div className={`nav-module ${commercialOpen ? "is-open" : ""} ${commercialActive ? "is-current" : ""}`}>
            <button
              type="button"
              className="nav-module-toggle"
              aria-expanded={commercialOpen}
              onClick={() => setCommercialOpen((value) => !value)}
            >
              Interface Commerciale
              <i className={`bi ${commercialOpen ? "bi-chevron-up" : "bi-chevron-down"} nav-module-caret`} aria-hidden />
            </button>
            {commercialOpen ? (
              <div className="nav-module-items">
                {commercialItems.map((item, index) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={`nav-link-item nested ${isNavActive(item.href, activeHref, COMMERCIAL_NAV) ? "active" : ""}`}
                    style={{ "--i": index } as CSSProperties}
                    onClick={onNavigate}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden />
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
              Interface Direction
              <i className={`bi ${directionOpen ? "bi-chevron-up" : "bi-chevron-down"} nav-module-caret`} aria-hidden />
            </button>
            {directionOpen ? (
              <div className="nav-module-items">
                {directionItems.map((item, index) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link-item nested ${isNavActive(item.href, activeHref, DIRECTION_NAV) ? "active" : ""}`}
                    style={{ "--i": index } as CSSProperties}
                    onClick={onNavigate}
                  >
                    <i className={`bi ${item.icon}`} aria-hidden />
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {modules.length > 0 || extraItems.length > 0 ? (
          <div className="nav-group">
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
                className={`nav-link-item module-link ${isNavActive(item.href, activeHref, extraItems) ? "active" : ""}`}
                style={{ "--i": index } as CSSProperties}
                onClick={onNavigate}
              >
                <i className={`bi ${item.icon}`} aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </nav>

      <div className="sidebar-config">
        <p className="sidebar-config-title">Configuration</p>
        <div className="config-card">
          <div className="mode-row">
            <span>
              <span className="mode-icon" aria-hidden>
                <i className={`bi ${darkMode ? "bi-moon-stars" : "bi-brightness-high"}`} />
              </span>
              {darkMode ? "Mode sombre" : "Mode clair"}
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={!darkMode}
                onChange={onToggleTheme}
                aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
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
            <span className="sidebar-user-role">{roleLabel}</span>
          </div>
          <Link href="/parametres" className="sidebar-user-more" onClick={onNavigate} aria-label="Mon compte">
            <i className="bi bi-three-dots-vertical" aria-hidden />
          </Link>
        </div>
      </div>
    </aside>
  );
}
