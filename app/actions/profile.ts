"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { changeOwnPassword, setUserPhotoUrl } from "@/lib/profile";

export type PasswordFormState = { error?: string; success?: string };

export async function changePasswordAction(_prev: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const session = await requireSession();
  try {
    const error = await changeOwnPassword(session, {
      current: String(formData.get("current") ?? ""),
      next: String(formData.get("next") ?? ""),
      confirm: String(formData.get("confirm") ?? ""),
    });
    return error ? { error } : { success: "Mot de passe modifié." };
  } catch {
    return { error: "Impossible de modifier le mot de passe pour le moment." };
  }
}

export async function updateUserPhotoAction(photoUrl: string | null) {
  const session = await requireSession();
  try {
    await setUserPhotoUrl(session, photoUrl);
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/direction");
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Impossible d'enregistrer la photo.",
    };
  }
}
