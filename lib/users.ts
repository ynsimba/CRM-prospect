import "server-only";

import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ASSIGNABLE_ROLES } from "@/lib/roles";
import { isStaffEmail, normalizeStaffEmail, staffEmailMessage } from "@/lib/staff-email";
import type { SessionPayload } from "@/lib/session";
import { orgScope } from "@/lib/auth";

export async function listUsers(session: SessionPayload) {
  return prisma.user.findMany({
    where: orgScope(session),
    include: { team: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listSalesAgents(session: SessionPayload) {
  return prisma.user.findMany({
    where: { ...orgScope(session), isActive: true, role: Role.SALES },
    select: { id: true, name: true, team: { select: { id: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

export async function createUser(
  session: SessionPayload,
  input: { name: string; email: string; password: string; role: Role; phone?: string; civility?: string },
) {
  const name = input.name.trim();
  const email = normalizeStaffEmail(input.email);
  if (!name || !email || input.password.length < 6) {
    throw new Error("Nom, e-mail et mot de passe (6 caractères min.) sont requis.");
  }
  if (!isStaffEmail(email)) {
    throw new Error(staffEmailMessage());
  }
  if (!ASSIGNABLE_ROLES.includes(input.role)) {
    throw new Error("Ce rôle n’est pas autorisé.");
  }
  if (session.role === Role.MANAGER && input.role === Role.OWNER) {
    throw new Error("La Direction ne peut pas créer un Admin.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    return await prisma.user.create({
      data: {
        organizationId: session.organizationId,
        name,
        email,
        phone: input.phone,
        civility: input.civility,
        role: input.role,
        passwordHash,
      },
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      throw new Error("Cet e-mail est déjà utilisé.");
    }
    throw error;
  }
}

export async function toggleUserActive(session: SessionPayload, userId: string) {
  if (userId === session.userId) {
    throw new Error("Tu ne peux pas désactiver ton propre compte.");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: session.organizationId },
  });
  if (!user) {
    throw new Error("Utilisateur introuvable.");
  }
  if (user.role === Role.SUPER_ADMIN) {
    throw new Error("Ce compte ne peut pas être modifié ici.");
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { isActive: !user.isActive },
  });
}
