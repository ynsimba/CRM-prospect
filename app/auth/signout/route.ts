import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteSession, getSession } from "@/lib/session";

async function clearAuth() {
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
}

export async function GET(request: NextRequest) {
  await clearAuth();
  return NextResponse.redirect(new URL("/login", request.url));
}

/** Utilisé par sendBeacon / fetch keepalive à la fermeture de fenêtre. */
export async function POST() {
  await clearAuth();
  return new NextResponse(null, { status: 204 });
}
