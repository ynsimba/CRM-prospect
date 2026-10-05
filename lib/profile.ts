import "server-only";

import { prisma } from "@/lib/prisma";
import { auditAs } from "@/lib/audit";
import { normalizePhotoDataUrl } from "@/lib/photo-url";
import type { SessionPayload } from "@/lib/session";

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
