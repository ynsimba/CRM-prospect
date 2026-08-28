"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { updateOrganizationSettings } from "@/lib/settings";

export type SettingsFormState = {
  error?: string;
  success?: string;
};

export async function updateOrganizationAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const session = await requirePermission(PERMISSIONS.settingsManage);

  try {
    await updateOrganizationSettings(session, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      currency: String(formData.get("currency") ?? "CDF"),
      timezone: String(formData.get("timezone") ?? "Africa/Kinshasa"),
    });
    await auditAs(session, {
      action: "settings.update",
      entity: "Organization",
      entityId: session.organizationId,
      summary: "Mise à jour des paramètres d’organisation",
    });
    revalidatePath("/parametres");
    revalidatePath("/");
    return { success: "Paramètres enregistrés." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d’enregistrer.",
    };
  }
}
