"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@prisma/client";
import Link from "next/link";
import Sidebar from "./Sidebar";

const MOBILE_QUERY = "(max-width: 991.98px)";

type AppShellProps = {
  activeHref: string;
  role?: Role;
  unreadCount?: number;
  children: ReactNode;
};

export default function AppShell({ activeHref, role, unreadCount = 0, children }: AppShellProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [lightMode, setLightMode] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    if (media.matches) {
      setSidebarVisible(false);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && window.matchMedia(MOBILE_QUERY).matches) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={`dashboard-page ${lightMode ? "" : "theme-dim"}`}>
      {sidebarVisible && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setSidebarVisible(false)}
        />
      )}

      <div className={`dashboard-shell ${sidebarVisible ? "" : "sidebar-hidden"}`}>
        <Sidebar
          open={sidebarVisible}
          activeHref={activeHref}
          role={role}
          unreadCount={unreadCount}
          lightMode={lightMode}
          onToggleLight={() => setLightMode((value) => !value)}
          onHide={() => setSidebarVisible(false)}
          onNavigate={() => {
            if (window.matchMedia(MOBILE_QUERY).matches) {
              setSidebarVisible(false);
            }
          }}
        />

        <main className="dashboard-main">
          <div className="main-toolbar">
            <button
              type="button"
              className="sidebar-toggle"
              aria-controls="app-sidebar"
              aria-expanded={sidebarVisible}
              onClick={() => setSidebarVisible((value) => !value)}
            >
              <i className={`bi ${sidebarVisible ? "bi-layout-sidebar-inset" : "bi-list"}`} aria-hidden />
              {sidebarVisible ? "Masquer le menu" : "Afficher le menu"}
            </button>
            <Link
              href="/notifications"
              className="toolbar-bell"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications"}
            >
              <i className="bi bi-bell" aria-hidden />
              {unreadCount > 0 ? (
                <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
