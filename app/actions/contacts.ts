"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { emptyToNull, parsePersonCategory, readOptionalId } from "@/lib/crm";
import { createContact } from "@/lib/contacts";
import { PERMISSIONS } from "@/lib/permissions";

export type ContactFormState = {
  error?: string;
  success?: string;
};

export async function createContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const session = await requirePermission(PERMISSIONS.companiesManage);

  try {
    const contact = await createContact(session, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      jobTitle: emptyToNull(formData.get("jobTitle")) ?? undefined,
      email: emptyToNull(formData.get("email")) ?? undefined,
      phone: emptyToNull(formData.get("phone")) ?? undefined,
      whatsapp: emptyToNull(formData.get("whatsapp")) ?? undefined,
      linkedin: emptyToNull(formData.get("linkedin")) ?? undefined,
      category: parsePersonCategory(formData.get("category")),
      companyId: readOptionalId(formData.get("companyId")),
      notes: emptyToNull(formData.get("notes")) ?? undefined,
    });
    await auditAs(session, {
      action: "contact.create",
      entity: "Contact",
      entityId: contact.id,
      summary: `Création du contact ${contact.firstName} ${contact.lastName}`,
    });
    revalidatePath("/contacts");
    revalidatePath("/contacts/nouveau");
    revalidatePath("/entreprises");
    return { success: `${contact.firstName} ${contact.lastName} a été ajouté.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer le contact.",
    };
  }
}
