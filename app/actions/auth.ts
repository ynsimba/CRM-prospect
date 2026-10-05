"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { newSessionToken } from "@/lib/session-policy";
import { loginFailureMessage } from "@/lib/db-error";
import { homePathForRole } from "@/lib/roles";

// Compared when the e-mail is unknown so both failure paths take the same bcrypt time.
const DUMMY_HASH = "$2b$10$PqiLcZfTR6D2J2dbkrrVEuI0blZMb372GB/Gqsp/c3ShG5NGnWfUe";

export type LoginState = {
  error?: string;
  /** Echoed back so the field keeps its value after a failed attempt. */
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "E-mail et mot de passe requis.", email };
  }

  let nextPath = "/";

  try {
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
    });

    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) {
      return { error: "Identifiants incorrects.", email };
    }

    const sessionToken = newSessionToken();
    const now = new Date();

    // Invalide toute session précédente sur un autre support.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        lastSeenAt: now,
        sessionToken,
      },
    });

    await writeAudit({
      organizationId: user.organizationId,
      actorId: user.id,
      action: "auth.login",
      entity: "User",
      entityId: user.id,
      summary: `Connexion de ${user.name}`,
    });

    await createSession({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      name: user.name,
      sessionToken,
    });
    nextPath = homePathForRole(user.role);
  } catch (error) {
    console.error(error);
    return { error: loginFailureMessage(error), email };
  }

  redirect(nextPath);
}

export async function logoutAction() {
  const session = await getSession();
  if (session?.userId && session.sessionToken) {
    const user = await prisma.user.findFirst({
      where: { id: session.userId, sessionToken: session.sessionToken },
      select: { id: true },
    });
    if (user) {
      await prisma.user
        .update({
          where: { id: user.id },
          data: { sessionToken: null },
        })
        .catch(() => undefined);
    }
  }
  await deleteSession();
  redirect("/login");
}
