"use server";

import { ProspectPriority } from "@/lib/enums";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { emptyToNull, fullName, parseCivility, parsePersonCategory, readOptionalId } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import { isAdminRole } from "@/lib/roles";
import {
  createProspect,
  deleteProspect,
  updateProspectRow,
  updateProspectStatus,
  updateProspectProfile,
} from "@/lib/prospects";

export type ProspectFormState = {
  error?: string;
  success?: string;
};

function readDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const date = new Date(`${raw}T09:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

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
      address: emptyToNull(formData.get("address")) ?? undefined,
      industry: emptyToNull(formData.get("industry")) ?? undefined,
      companySize: emptyToNull(formData.get("companySize") ?? formData.get("size")) ?? undefined,
      category: parsePersonCategory(formData.get("category")),
      civility: parseCivility(formData.get("civility")),
      companyId: readOptionalId(formData.get("companyId")),
      companyName: emptyToNull(formData.get("companyName")) ?? undefined,
      statusId: String(formData.get("statusId") ?? ""),
      sourceId: readOptionalId(formData.get("sourceId")),
      ownerId: readOptionalId(formData.get("ownerId")),
      priority: readPriority(formData.get("priority")),
      notes: emptyToNull(formData.get("notes")) ?? undefined,
      statusComment: emptyToNull(formData.get("statusComment") ?? formData.get("notes")) ?? undefined,
      firstContactAt: readDate(formData.get("firstContactAt")),
      nextContactAt: readDate(formData.get("nextContactAt")),
      tagIds: formData.getAll("tagIds").map(String).filter(Boolean),
    });
    const label = prospect.companyId
      ? emptyToNull(formData.get("companyName")) ?? `${prospect.firstName} ${prospect.lastName}`
      : `${prospect.firstName} ${prospect.lastName}`;
    await auditAs(session, {
      action: "prospect.create",
      entity: "Prospect",
      entityId: prospect.id,
      summary: `Création du prospect ${label}`,
    });
    revalidatePath("/prospects");
    revalidatePath("/interface");
    revalidatePath("/direction");
    revalidatePath("/direction/prospects");
    revalidatePath("/suivi");
    revalidatePath("/archives");
    revalidatePath("/");
    revalidatePath("/rapports");
    revalidatePath("/notifications");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer le prospect.",
    };
  }

  redirect("/prospects?created=1");
}

export async function updateProspectStatusAction(prospectId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const prospect = await updateProspectStatus(
    session,
    prospectId,
    String(formData.get("statusId") ?? ""),
    emptyToNull(formData.get("statusComment")),
  );
  await auditAs(session, {
    action: "prospect.status",
    entity: "Prospect",
    entityId: prospect.id,
    summary: `Changement de statut pour ${prospect.firstName} ${prospect.lastName}`,
  });
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  revalidatePath("/suivi");
  revalidatePath("/interface");
  revalidatePath("/direction");
  revalidatePath("/historique");
  revalidatePath("/archives");
  revalidatePath("/");
  revalidatePath("/notifications");
}

export async function moveProspectStatusAction(prospectId: string, statusId: string) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const prospect = await updateProspectStatus(session, prospectId, statusId);
  await auditAs(session, {
    action: "prospect.status",
    entity: "Prospect",
    entityId: prospect.id,
    summary: `Kanban : ${prospect.firstName} ${prospect.lastName}`,
  });
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospect.id}`);
  revalidatePath("/suivi");
  revalidatePath("/interface");
  revalidatePath("/direction");
  revalidatePath("/historique");
  revalidatePath("/");
}

export async function updateProspectRowAction(prospectId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const meeting = String(formData.get("nextContactAt") ?? "").trim();
  const comment = emptyToNull(formData.get("notes"));
  const prospect = await updateProspectRow(session, prospectId, {
    statusId: String(formData.get("statusId") ?? "") || undefined,
    notes: comment,
    statusComment: comment,
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
  revalidatePath("/interface");
  revalidatePath("/direction");
  revalidatePath("/direction/prospects");
  revalidatePath("/");
}

export async function updateProspectProfileAction(
  prospectId: string,
  _prev: ProspectFormState,
  formData: FormData,
): Promise<ProspectFormState> {
  const session = await requirePermission(PERMISSIONS.prospectsManage);

  function readDate(value: FormDataEntryValue | null) {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const date = new Date(`${raw}T09:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  try {
    const patch: Parameters<typeof updateProspectProfile>[2] = {};
    const textFields = [
      "jobTitle",
      "email",
      "phone",
      "whatsapp",
      "city",
      "address",
      "industry",
      "companySize",
      "notes",
    ] as const;
    for (const field of textFields) {
      if (formData.has(field)) {
        patch[field] = emptyToNull(formData.get(field));
      }
    }
    if (formData.has("firstContactAt")) {
      patch.firstContactAt = readDate(formData.get("firstContactAt"));
    }
    if (formData.has("nextContactAt")) {
      patch.nextContactAt = readDate(formData.get("nextContactAt"));
    }

    const prospect = await updateProspectProfile(session, prospectId, patch);
    await auditAs(session, {
      action: "prospect.profile",
      entity: "Prospect",
      entityId: prospect.id,
      summary: `Complément de fiche ${prospect.firstName} ${prospect.lastName}`,
    });
    revalidatePath("/prospects");
    revalidatePath(`/prospects/${prospect.id}`);
    revalidatePath("/suivi");
    revalidatePath("/interface");
    revalidatePath("/direction");
    revalidatePath("/direction/prospects");
    revalidatePath("/");
    return { success: "Fiche mise à jour avec succès." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de mettre à jour la fiche.",
    };
  }
}

export async function deleteProspectAction(prospectId: string) {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  if (!isAdminRole(session.role)) {
    throw new Error("Seuls les administrateurs peuvent supprimer un prospect.");
  }

  const prospect = await deleteProspect(session, prospectId);
  await auditAs(session, {
    action: "prospect.delete",
    entity: "Prospect",
    entityId: prospect.id,
    summary: `Suppression de ${fullName(prospect.firstName, prospect.lastName)}${prospect.displayCode ? ` (${prospect.displayCode})` : ""}`,
  });
  revalidatePath("/prospects");
  revalidatePath("/suivi");
  revalidatePath("/interface");
  revalidatePath("/archives");
  revalidatePath("/direction");
  revalidatePath("/direction/prospects");
  revalidatePath("/direction/archives");
  revalidatePath("/");
  redirect("/prospects");
}
