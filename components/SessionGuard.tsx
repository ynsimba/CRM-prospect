"use client";

import { useEffect, useRef } from "react";
import { SESSION_HEARTBEAT_MS, SESSION_IDLE_MS } from "@/lib/session-policy";

const TABS_KEY = "safecheck.openTabs";

function readTabs(): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(TABS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeTabs(tabs: Record<string, number>) {
  try {
    window.localStorage.setItem(TABS_KEY, JSON.stringify(tabs));
  } catch {
    // Ignore quota / mode privé.
  }
}

function pruneStaleTabs(tabs: Record<string, number>, now = Date.now()) {
  const next: Record<string, number> = {};
  for (const [id, ts] of Object.entries(tabs)) {
    if (now - ts < SESSION_IDLE_MS) next[id] = ts;
  }
  return next;
}

async function signOutBeacon() {
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/auth/signout");
      return;
    }
  } catch {
    // Fallback ci-dessous.
  }
  try {
    await fetch("/auth/signout", { method: "POST", keepalive: true, credentials: "same-origin" });
  } catch {
    // Fermeture de page : best effort.
  }
}

function redirectLogin() {
  window.location.assign("/login");
}

/**
 * Garde la session vivante pendant l’activité, expire à 15 min d’inactivité,
 * et déconnecte quand le dernier onglet/fenêtre de l’app se ferme.
 */
export default function SessionGuard() {
  const tabIdRef = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const lastActivityRef = useRef(Date.now());
  const closingRef = useRef(false);

  useEffect(() => {
    const tabId = tabIdRef.current;

    function touchActivity() {
      lastActivityRef.current = Date.now();
    }

    function registerTab() {
      const tabs = pruneStaleTabs(readTabs());
      tabs[tabId] = Date.now();
      writeTabs(tabs);
    }

    function unregisterTabAndMaybeLogout() {
      if (closingRef.current) return;
      closingRef.current = true;
      const tabs = pruneStaleTabs(readTabs());
      delete tabs[tabId];
      writeTabs(tabs);
      if (Object.keys(tabs).length === 0) {
        void signOutBeacon();
      }
    }

    async function heartbeat() {
      if (document.visibilityState === "hidden") return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor > SESSION_IDLE_MS) {
        await fetch("/auth/signout", { method: "POST", credentials: "same-origin" });
        redirectLogin();
        return;
      }
      try {
        const response = await fetch("/auth/heartbeat", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            // Activité récente (< 2 min) : avance lastSeenAt côté serveur.
            "X-User-Active": idleFor < 2 * 60_000 ? "1" : "0",
          },
        });
        if (!response.ok) {
          redirectLogin();
        }
      } catch {
        // Réseau temporaire : le prochain tick réessaiera.
      }
    }

    registerTab();
    touchActivity();
    void heartbeat();

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];
    for (const event of activityEvents) {
      window.addEventListener(event, touchActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        registerTab();
        touchActivity();
        void heartbeat();
      }
    });

    const heartbeatTimer = window.setInterval(() => {
      registerTab();
      void heartbeat();
    }, SESSION_HEARTBEAT_MS);

    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > SESSION_IDLE_MS) {
        void fetch("/auth/signout", { method: "POST", credentials: "same-origin" }).finally(redirectLogin);
      }
    }, 15_000);

    const onPageHide = () => {
      unregisterTabAndMaybeLogout();
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      window.clearInterval(heartbeatTimer);
      window.clearInterval(idleTimer);
      for (const event of activityEvents) {
        window.removeEventListener(event, touchActivity);
      }
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
  }, []);

  return null;
}
