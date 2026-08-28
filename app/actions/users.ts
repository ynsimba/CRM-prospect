"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/permissions";
import { ASSIGNABLE_ROLES } from "@/lib/roles";
import { createUser, toggleUserActive } from "@/lib/users";

export type UserFormState = {
  error?: string;
  success?: string;
};

function readRole(value: FormDataEntryValue | null): Role {
  const raw = String(value ?? "SALES");
  return (ASSIGNABLE_ROLES as string[]).includes(raw) ? (raw as Role) : Role.SALES;
}

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requirePermission(PERMISSIONS.usersManage);

  try {
    const user = await createUser(session, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      role: readRole(formData.get("role")),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
    });
    await auditAs(session, {
      action: "user.create",
      entity: "User",
      entityId: user.id,
      summary: `Création du compte ${user.email} (${user.role})`,
    });
    revalidatePath("/parametres");
    revalidatePath("/equipe");
    return { success: `${user.name} a été ajouté.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer l’utilisateur.",
    };
  }
}

export async function toggleUserAction(userId: string) {
  const session = await requirePermission(PERMISSIONS.usersManage);
  const user = await toggleUserActive(session, userId);
  await auditAs(session, {
    action: user.isActive ? "user.activate" : "user.deactivate",
    entity: "User",
    entityId: user.id,
    summary: `${user.name} ${user.isActive ? "activé" : "désactivé"}`,
  });
  revalidatePath("/parametres");
  revalidatePath("/equipe");
}
