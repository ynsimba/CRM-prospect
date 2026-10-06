import "server-only";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auditAs } from "@/lib/audit";
import { passwordChangeError } from "@/lib/password-policy";
import { normalizePhotoDataUrl } from "@/lib/photo-url";
import type { SessionPayload } from "@/lib/session";

/** Change le mot de passe du compte connecté ; renvoie un message d’erreur, ou `null` si c’est fait. */
export async function changeOwnPassword(
  session: SessionPayload,
  input: { current: string; next: string; confirm: string },
) {
  const invalid = passwordChangeError(input);
  if (invalid) return invalid;

  const user = await prisma.user.findFirst({
    where: { id: session.userId, organizationId: session.organizationId, isActive: true },
    select: { id: true, passwordHash: true },
  });
  if (!user) return "Compte introuvable.";

  const matches = await bcrypt.compare(input.current, user.passwordHash ?? "");
  if (!matches) return "Mot de passe actuel incorrect.";

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(input.next, 10) },
  });

  await auditAs(session, {
    action: "UPDATE",
    entity: "User",
    entityId: user.id,
    summary: "Mot de passe modifié par l’utilisateur",
  });
  return null;
}

export async function setUserPhotoUrl(session: SessionPayload, photoUrl: string | null | undefined) {
  const next = normalizePhotoDataUrl(photoUrl);
  if (next === undefined) return;

  const before = await prisma.user.findFirst({
    where: { id: session.userId, organizationId: session.organizationId },
    select: { photoUrl: true },
  });
  if (!before) throw new Error("Compte introuvable.");

  await prisma.user.update({
    where: { id: session.userId },
    data: { photoUrl: next },
  });

  await auditAs(session, {
    action: "UPDATE",
    entity: "User",
    entityId: session.userId,
    summary: next ? "Photo de profil mise à jour" : "Photo de profil retirée",
    before: { photoUrl: Boolean(before.photoUrl) },
    after: { photoUrl: Boolean(next) },
  });
}
