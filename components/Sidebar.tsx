"use client";

import type { CSSProperties } from "react";
import type { Role } from "@prisma/client";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { isNavActive, navForRole } from "@/lib/nav";

type SidebarProps = {
  open: boolean;
  activeHref: string;
  role?: Role;
  unreadCount?: number;
  lightMode: boolean;
  onToggleLight: () => void;
  onHide: () => void;
  onNavigate: () => void;
};

export default function Sidebar({
  open,
  activeHref,
  role,
  unreadCount = 0,
  lightMode,
  onToggleLight,
  onHide,
  onNavigate,
}: SidebarProps) {
  const { main: mainItems, config: configItems } = navForRole(role);

  return (
    <aside id="app-sidebar" className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-logo">
        <span className="logo-mark" aria-hidden>
          //
        </span>
        <span>Prospect</span>
        <button
          type="button"
          className="sidebar-hide"
          aria-label="Masquer le menu"
          onClick={onHide}
        >
          <i className="bi bi-chevron-left" aria-hidden />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {mainItems.map((item, index) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`nav-link-item ${isNavActive(item.href, activeHref, mainItems) ? "active" : ""}`}
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
              <i className="bi bi-circle-half" aria-hidden />
              Mode clair
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={lightMode}
                onChange={onToggleLight}
                aria-label="Activer le mode clair"
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
        <Link
          href="/notifications"
          className={`nav-link-item ${activeHref === "/notifications" ? "active" : ""}`}
          onClick={onNavigate}
          aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications"}
        >
          <i className="bi bi-bell" aria-hidden />
          Alertes
          {unreadCount > 0 ? (
            <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="btn-logout">
            <i className="bi bi-box-arrow-right" aria-hidden />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
