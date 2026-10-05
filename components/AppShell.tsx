"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Role } from "@/lib/enums";
import Link from "next/link";
import Sidebar from "./Sidebar";
import ToolbarProfileAvatar from "./ToolbarProfileAvatar";
import SessionGuard from "./SessionGuard";
import { initialsFromName } from "@/lib/crm";
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
  photoUrl?: string | null;
  unreadCount?: number;
  children: ReactNode;
};

export default function AppShell({
  activeHref,
  role,
  userName,
  photoUrl = null,
  unreadCount = 0,
  children,
}: AppShellProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [theme, setTheme] = useState<ThemeName>("light");
  const initials = initialsFromName(userName ?? "") || "SC";

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
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        window.location.assign("/prospects");
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
      <SessionGuard />
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
              {sidebarVisible ? "Masquer" : "Menu"}
            </button>

            <Link href="/prospects" className="main-toolbar-search" aria-label="Rechercher un prospect">
              <i className="bi bi-search" aria-hidden />
              <span>Rechercher un prospect, une entreprise…</span>
              <kbd>⌘ K</kbd>
            </Link>

            <div className="main-toolbar-actions">
              <Link
                href="/notifications"
                className="toolbar-icon"
                aria-label={unreadCount > 0 ? `Notifications (${unreadCount})` : "Notifications"}
              >
                <i className="bi bi-bell" aria-hidden />
                {unreadCount > 0 ? (
                  <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                ) : null}
              </Link>
              <Link href="/notes" className="toolbar-icon" aria-label="Messages">
                <i className="bi bi-chat-dots" aria-hidden />
              </Link>
              <ToolbarProfileAvatar userName={userName} initials={initials} photoUrl={photoUrl} />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
