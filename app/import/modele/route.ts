import { requirePermission } from "@/lib/auth";
import { templateCsv } from "@/lib/import";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  await requirePermission(PERMISSIONS.prospectsManage);
  return new Response(templateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="modele-prospects.csv"',
    },
  });
}
