"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@/lib/enums";
import Link from "next/link";
import Sidebar from "./Sidebar";
import {
  applyThemeClass,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemeName,
} from "@/lib/theme";

const MOBILE_QUERY = "(max-width: 991.98px)";

type AppShellProps = {
  activeHref: string;
  role?: Role;
  userName?: string;
  unreadCount?: number;
  children: ReactNode;
};

export default function AppShell({ activeHref, role, userName, unreadCount = 0, children }: AppShellProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [theme, setTheme] = useState<ThemeName>("light");

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    if (media.matches) {
      // Post-hydration sync from matchMedia: reading it during render would mismatch the SSR HTML.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = resolveTheme(stored, prefersDark);
    // Same as above: localStorage is only readable after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);
    applyThemeClass(resolved, document.documentElement);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onScheme = () => {
      const current = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (current === "dark" || current === "light") return;
      const next = media.matches ? "dark" : "light";
      setTheme(next);
      applyThemeClass(next, document.documentElement);
    };
    media.addEventListener("change", onScheme);
    return () => media.removeEventListener("change", onScheme);
  }, []);

  function toggleTheme() {
    const next: ThemeName = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyThemeClass(next, document.documentElement);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Quota / mode privé : le thème reste appliqué pour cette session.
    }
  }

  return (
    <div className={`dashboard-page ${theme === "dark" ? "theme-dim" : ""}`}>
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
          userName={userName}
          unreadCount={unreadCount}
          darkMode={theme === "dark"}
          onToggleTheme={toggleTheme}
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
