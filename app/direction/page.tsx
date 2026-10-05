import Dashboard from "@/components/Dashboard";
import { requireDirector } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { prisma } from "@/lib/prisma";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function DirectorDashboardPage() {
  const session = await requireDirector();
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
      activeHref="/direction"
      showPerformance={false}
    />
  );
}
