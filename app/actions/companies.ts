"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { emptyToNull, readOptionalId } from "@/lib/crm";
import { createCompany } from "@/lib/companies";
import { PERMISSIONS } from "@/lib/permissions";

export type CompanyFormState = {
  error?: string;
  success?: string;
};

export async function createCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  const session = await requirePermission(PERMISSIONS.companiesManage);

  try {
    const company = await createCompany(session, {
      name: String(formData.get("name") ?? ""),
      industry: emptyToNull(formData.get("industry")) ?? undefined,
      website: emptyToNull(formData.get("website")) ?? undefined,
      email: emptyToNull(formData.get("email")) ?? undefined,
      phone: emptyToNull(formData.get("phone")) ?? undefined,
      city: emptyToNull(formData.get("city")) ?? undefined,
      address: emptyToNull(formData.get("address")) ?? undefined,
      size: emptyToNull(formData.get("size")) ?? undefined,
      notes: emptyToNull(formData.get("notes")) ?? undefined,
      ownerId: readOptionalId(formData.get("ownerId")),
    });
    await auditAs(session, {
      action: "company.create",
      entity: "Company",
      entityId: company.id,
      summary: `Création de l’entreprise ${company.name}`,
    });
    revalidatePath("/entreprises");
    revalidatePath("/prospects");
    return { success: `${company.name} a été ajoutée.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer l’entreprise.",
    };
  }
}
