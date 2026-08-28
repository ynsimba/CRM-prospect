"use server";

import { ProspectPriority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { emptyToNull, parsePersonCategory, readOptionalId } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import { createProspect, updateProspectRow, updateProspectStatus } from "@/lib/prospects";

export type ProspectFormState = {
  error?: string;
  success?: string;
};

function readPriority(value: FormDataEntryValue | null): ProspectPriority {
  const raw = String(value ?? "NORMAL");
  if (raw === "LOW" || raw === "HIGH" || raw === "URGENT") return raw;
  return ProspectPriority.NORMAL;
}

export async function createProspectAction(
  _prev: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const session = await requirePermission(PERMISSIONS.prospectsManage);

  try {
    const prospect = await createProspect(session, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      jobTitle: emptyToNull(formData.get("jobTitle")) ?? undefined,
      email: emptyToNull(formData.get("email")) ?? undefined,
      phone: emptyToNull(formData.get("phone")) ?? undefined,
      whatsapp: emptyToNull(formData.get("whatsapp")) ?? undefined,
      city: emptyToNull(formData.get("city")) ?? undefined,
      category: parsePersonCategory(formData.get("category")),
      companyId: readOptionalId(formData.get("companyId")),
      statusId: String(formData.get("statusId") ?? ""),
      sourceId: readOptionalId(formData.get("sourceId")),
      ownerId: readOptionalId(formData.get("ownerId")),
      priority: readPriority(formData.get("priority")),
      notes: emptyToNull(formData.get("notes")) ?? undefined,
      tagIds: formData.getAll("tagIds").map(String).filter(Boolean),
    });
    await auditAs(session, {
      action: "prospect.create",
      entity: "Prospect",
      entityId: prospect.id,
      summary: `Création du prospect ${prospect.firstName} ${prospect.lastName}`,
    });
    revalidatePath("/prospects");
    revalidatePath("/suivi");
    revalidatePath("/archives");
    revalidatePath("/");
    revalidatePath("/rapports");
    revalidatePath("/notifications");
    return { success: `${prospect.firstName} ${prospect.lastName} a été ajouté.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer le prospect.",
    };
  }
}

export async function updateProspectStatusAction(prospectId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const prospect = await updateProspectStatus(session, prospectId, String(formData.get("statusId") ?? ""));
  await auditAs(session, {
    action: "prospect.status",
    entity: "Prospect",
    entityId: prospect.id,
    summary: `Changement de statut pour ${prospect.firstName} ${prospect.lastName}`,
  });
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  revalidatePath("/suivi");
  revalidatePath("/archives");
  revalidatePath("/");
  revalidatePath("/notifications");
}

export async function updateProspectRowAction(prospectId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const meeting = String(formData.get("nextContactAt") ?? "").trim();
  const prospect = await updateProspectRow(session, prospectId, {
    statusId: String(formData.get("statusId") ?? "") || undefined,
    notes: emptyToNull(formData.get("notes")),
    ownerId: readOptionalId(formData.get("ownerId")) ?? null,
    nextContactAt: meeting ? new Date(`${meeting}T09:00:00`) : null,
  });
  await auditAs(session, {
    action: "prospect.update",
    entity: "Prospect",
    entityId: prospect.id,
    summary: `Mise à jour de la fiche ${prospect.firstName} ${prospect.lastName}`,
  });
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  revalidatePath("/suivi");
  revalidatePath("/");
}
