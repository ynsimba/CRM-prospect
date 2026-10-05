import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/lib/enums";
import { getSessionSecret } from "@/lib/env";
import { SESSION_IDLE_MS } from "@/lib/session-policy";

const COOKIE_NAME = "session";

export type SessionPayload = {
  userId: string;
  organizationId: string;
  role: Role;
  name: string;
  /** Jeton unique de session (un seul support connecté). */
  sessionToken: string;
  /** Enriched by requireSession from the database (not stored in the JWT). */
  photoUrl?: string | null;
};

function getSecret() {
  const secret = getSessionSecret();
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET manquant ou trop court");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({
    userId: payload.userId,
    organizationId: payload.organizationId,
    role: payload.role,
    name: payload.name,
    sessionToken: payload.sessionToken,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    // Fenêtre glissante : renouvelée à chaque activité serveur.
    .setExpirationTime(`${Math.ceil(SESSION_IDLE_MS / 1000)}s`)
    .sign(getSecret());
}

export async function decrypt(session: string | undefined) {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getSecret(), {
      algorithms: ["HS256"],
    });
    const data = payload as Partial<SessionPayload> & { userId?: string };
    if (!data.userId || !data.organizationId || !data.role || !data.name || !data.sessionToken) {
      return null;
    }
    return data as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + SESSION_IDLE_MS);
  const session = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
