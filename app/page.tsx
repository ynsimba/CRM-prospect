import Dashboard from "@/components/Dashboard";
import { requireSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard";
import { parseDashboardPeriod } from "@/lib/dashboard-logic";
import { prisma } from "@/lib/prisma";
import { homePathForRole } from "@/lib/roles";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const session = await requireSession();
  if (session.role === "MANAGER") {
    redirect(homePathForRole(session.role));
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, organizationId: session.organizationId },
  });

  const { periode } = await searchParams;
  const stats = await getDashboardStats(session, parseDashboardPeriod(periode));

  return <Dashboard userName={user?.name ?? session.name} civility={user?.civility} stats={stats} />;
}
