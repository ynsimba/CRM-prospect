/** Durée max d’inactivité avant déconnexion forcée. */
export const SESSION_IDLE_MS = 15 * 60 * 1000;

/** Intervalle client de heartbeat pendant une session active. */
export const SESSION_HEARTBEAT_MS = 60_000;

export function isSessionIdle(lastSeenAt: Date | string | null | undefined, now = Date.now()) {
  if (!lastSeenAt) return false;
  const seen = lastSeenAt instanceof Date ? lastSeenAt.getTime() : new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return true;
  return now - seen > SESSION_IDLE_MS;
}

export function newSessionToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
