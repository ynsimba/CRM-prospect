"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { decodeNotificationBody } from "@/lib/notify-logic";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

export async function openNotificationAction(id: string) {
  const session = await requireSession();
  const row = await markNotificationRead(session, id);
  const { href } = decodeNotificationBody(row.body);
  revalidatePath("/notifications");
  redirect(href ?? "/notifications");
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession();
  await markAllNotificationsRead(session);
  revalidatePath("/notifications");
}
