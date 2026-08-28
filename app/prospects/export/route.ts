import { requirePermission } from "@/lib/auth";
import { exportProspectsCsv } from "@/lib/import";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const csv = await exportProspectsCsv(session);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="prospects.csv"',
    },
  });
}
