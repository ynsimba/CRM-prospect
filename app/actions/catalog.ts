"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { createSource, createStatus, createTag } from "@/lib/catalog";
import { PERMISSIONS } from "@/lib/permissions";

export type CatalogFormState = {
  error?: string;
  success?: string;
};

async function handleCreate(
  kind: "status" | "source" | "tag",
  formData: FormData,
): Promise<CatalogFormState> {
  const session = await requirePermission(PERMISSIONS.settingsManage);
  const name = String(formData.get("name") ?? "");

  try {
    if (kind === "status") {
      const status = await createStatus(session, name);
      await auditAs(session, {
        action: "status.create",
        entity: "ProspectStatus",
        entityId: status.id,
        summary: `Statut ${status.name}`,
      });
    } else if (kind === "source") {
      const source = await createSource(session, name);
      await auditAs(session, {
        action: "source.create",
        entity: "ProspectSource",
        entityId: source.id,
        summary: `Source ${source.name}`,
      });
    } else {
      const tag = await createTag(session, name);
      await auditAs(session, {
        action: "tag.create",
        entity: "Tag",
        entityId: tag.id,
        summary: `Tag ${tag.name}`,
      });
    }
    revalidatePath("/parametres");
    revalidatePath("/prospects");
    return { success: "Ajouté." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d’ajouter.";
    if (message.includes("Unique constraint")) {
      return { error: "Cette valeur existe déjà." };
    }
    return { error: message };
  }
}

export async function createStatusAction(_prev: CatalogFormState, formData: FormData) {
  return handleCreate("status", formData);
}

export async function createSourceAction(_prev: CatalogFormState, formData: FormData) {
  return handleCreate("source", formData);
}

export async function createTagAction(_prev: CatalogFormState, formData: FormData) {
  return handleCreate("tag", formData);
}
