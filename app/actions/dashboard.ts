"use server";

import { requireSession } from "@/lib/auth";
import { listDashboardKpiDetails } from "@/lib/dashboard";
import type { DashboardKpiDetails } from "@/lib/dashboard-logic";

export async function getDashboardKpiDetailsAction(kpiId: string): Promise<DashboardKpiDetails> {
  const session = await requireSession();
  return listDashboardKpiDetails(session, kpiId);
}
