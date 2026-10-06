import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Le manifeste est lu sans cookie par le navigateur lors de l’installation de l’application.
const PUBLIC_PATHS = new Set(["/login", "/auth/signout", "/manifest.webmanifest"]);
const COOKIE_NAME = "session";

function getSecret() {
  const secret = process.env.SESSION_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  let authenticated = false;
  let staleCookie = Boolean(token);

  if (token && process.env.SESSION_SECRET) {
    try {
      const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
      // Ancien JWT (sans sessionToken) ou claims incomplets = non authentifié.
      authenticated = Boolean(
        payload.userId && payload.organizationId && payload.role && payload.name && payload.sessionToken,
      );
      staleCookie = !authenticated;
    } catch {
      authenticated = false;
      staleCookie = true;
    }
  }

  if (!authenticated && !PUBLIC_PATHS.has(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    return staleCookie ? clearSessionCookie(response) : response;
  }

  if (authenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Cookie pourri sur /login : on le purge pour éviter toute boucle.
  if (!authenticated && pathname === "/login" && staleCookie) {
    return clearSessionCookie(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
