import ModuleEmpty from "@/components/ModuleEmpty";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";

export default async function CampaignsPage() {
  await requirePermission(PERMISSIONS.campaignsManage);
  return (
    <ModuleEmpty
      activeHref="/campagnes"
      title="Campagnes"
      subtitle="Regrouper des prospects et suivre les résultats."
      empty="Aucune campagne. Le module sera branché après le cœur CRM."
    />
  );
}
