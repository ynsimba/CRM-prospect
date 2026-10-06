import Dashboard from "@/components/Dashboard";
import { requireDirector } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { parseDashboardPeriod } from "@/lib/dashboard-logic";
import { prisma } from "@/lib/prisma";

export default async function DirectorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const session = await requireDirector();
  const user = await prisma.user.findFirst({
    where: { id: session.userId, organizationId: session.organizationId },
  });
  const { periode } = await searchParams;
  const stats = await getDashboardStats(session, parseDashboardPeriod(periode));

  return (
    <Dashboard
      userName={user?.name ?? session.name}
      civility={user?.civility}
      stats={stats}
      activeHref="/direction"
      showPerformance={false}
    />
  );
}
