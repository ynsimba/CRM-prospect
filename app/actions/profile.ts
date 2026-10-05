"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { setUserPhotoUrl } from "@/lib/profile";

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
