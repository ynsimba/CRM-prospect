import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, getSession } from "@/lib/session";
import { isSessionIdle } from "@/lib/session-policy";

/**
 * Renouvelle le cookie JWT tant que la session est valide.
 * lastSeenAt n’est avancé que si le client signale une activité récente.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.userId || !session.sessionToken) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      organizationId: session.organizationId,
      isActive: true,
      sessionToken: session.sessionToken,
    },
    select: { id: true, role: true, name: true, lastSeenAt: true, photoUrl: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, reason: "session_replaced" }, { status: 401 });
  }

  if (isSessionIdle(user.lastSeenAt as Date | null)) {
    await prisma.user
      .update({
        where: { id: user.id },
        data: { sessionToken: null },
      })
      .catch(() => undefined);
    return NextResponse.json({ ok: false, reason: "idle" }, { status: 401 });
  }

  const userActive = request.headers.get("x-user-active") === "1";
  const now = new Date();
  if (userActive) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: now },
    });
  }

  await createSession({
    userId: user.id,
    organizationId: session.organizationId,
    role: user.role,
    name: user.name,
    sessionToken: session.sessionToken,
    photoUrl: (user.photoUrl as string | null) ?? null,
  });

  return NextResponse.json({
    ok: true,
    lastSeenAt: userActive ? now.toISOString() : undefined,
  });
}
