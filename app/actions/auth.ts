"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { createSession, deleteSession } from "@/lib/session";
import { loginFailureMessage } from "@/lib/db-error";

export type LoginState = {
  error?: string;
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
    return { error: "E-mail et mot de passe requis." };
  }

  let nextPath = "/";

  try {
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
    });

    if (!user) {
      return { error: "Identifiants incorrects." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { error: "Identifiants incorrects." };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
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
    });
    nextPath = user.role === "SUPER_ADMIN" ? "/admin" : "/";
  } catch (error) {
    console.error(error);
    return { error: loginFailureMessage(error) };
  }

  redirect(nextPath);
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
