import type { ReactNode } from "react";
import AppShell from "@/components/AppShell";
import { requireSession } from "@/lib/auth";
import { countUnreadNotifications, ensureDueNotifications } from "@/lib/notifications";

export default async function Shell({
  activeHref,
  children,
}: {
  activeHref: string;
  children: ReactNode;
}) {
  const session = await requireSession();
  try {
    await ensureDueNotifications(session);
  } catch {
    // Les alertes de relance ne doivent pas bloquer les pages.
  }
  const unreadCount =
    session.role === "SUPER_ADMIN" ? 0 : await countUnreadNotifications(session);

  return (
    <AppShell activeHref={activeHref} role={session.role} userName={session.name} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}
