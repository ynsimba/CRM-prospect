import Dashboard from "@/components/Dashboard";
import { requireSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";
import { homePathForRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function Home() {
  const session = await requireSession();
  if (session.role === "MANAGER") {
    redirect(homePathForRole(session.role));
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, organizationId: session.organizationId },
  });

  const stats = await getDashboardStats(session);

  return (
    <Dashboard
      userName={user?.name ?? session.name}
      userInitials={initialsFromName(user?.name ?? session.name) || "PC"}
      civility={user?.civility}
      photoUrl={(user?.photoUrl as string | null | undefined) ?? session.photoUrl ?? null}
      stats={stats}
    />
  );
}
