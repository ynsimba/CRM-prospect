"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { emptyToNull, readOptionalId } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import { parseFcAmount } from "@/lib/pipeline-logic";
import {
  convertProspectToOpportunity,
  createOpportunity,
  moveOpportunity,
} from "@/lib/pipeline";

export type OpportunityFormState = {
  error?: string;
  success?: string;
};

function readDate(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date de clôture invalide.");
  }
  return date;
}

export async function createOpportunityAction(
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const session = await requirePermission(PERMISSIONS.pipelineManage);

  try {
    const opportunity = await createOpportunity(session, {
      name: String(formData.get("name") ?? ""),
      amount: parseFcAmount(String(formData.get("amount") ?? "")),
      stageId: String(formData.get("stageId") ?? ""),
      companyId: readOptionalId(formData.get("companyId")),
      prospectId: readOptionalId(formData.get("prospectId")),
      ownerId: readOptionalId(formData.get("ownerId")),
      expectedCloseAt: readDate(formData.get("expectedCloseAt")),
      description: emptyToNull(formData.get("description")) ?? undefined,
    });
    await auditAs(session, {
      action: "opportunity.create",
      entity: "Opportunity",
      entityId: opportunity.id,
      summary: `Création de l’opportunité ${opportunity.name}`,
    });
    revalidatePath("/pipeline");
    revalidatePath("/");
    revalidatePath("/rapports");
    return { success: `${opportunity.name} a été ajoutée.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer l’opportunité.",
    };
  }
}

export async function moveOpportunityAction(opportunityId: string, stageId: string) {
  const session = await requirePermission(PERMISSIONS.pipelineManage);
  const opportunity = await moveOpportunity(session, opportunityId, stageId);
  await auditAs(session, {
    action: "opportunity.move",
    entity: "Opportunity",
    entityId: opportunity.id,
    summary: `Déplacement de ${opportunity.name}`,
  });
  revalidatePath("/pipeline");
  revalidatePath(`/pipeline/${opportunity.id}`);
  revalidatePath("/");
  revalidatePath("/rapports");
  revalidatePath("/notifications");
}

export async function moveOpportunityFormAction(opportunityId: string, formData: FormData) {
  await moveOpportunityAction(opportunityId, String(formData.get("stageId") ?? ""));
}

export async function convertProspectAction(
  prospectId: string,
  _prev: OpportunityFormState,
  formData: FormData,
): Promise<OpportunityFormState> {
  const session = await requirePermission(PERMISSIONS.pipelineManage);

  try {
    const opportunity = await convertProspectToOpportunity(session, prospectId, {
      name: String(formData.get("name") ?? ""),
      amount: parseFcAmount(String(formData.get("amount") ?? "")),
      stageId: readOptionalId(formData.get("stageId")),
    });
    await auditAs(session, {
      action: "prospect.convert",
      entity: "Opportunity",
      entityId: opportunity.id,
      summary: `Conversion du prospect en ${opportunity.name}`,
    });
    revalidatePath("/pipeline");
    revalidatePath("/prospects");
    revalidatePath(`/prospects/${prospectId}`);
    revalidatePath("/");
    revalidatePath("/notifications");
    return { success: `Opportunité créée : ${opportunity.name}.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de convertir ce prospect.",
    };
  }
}
