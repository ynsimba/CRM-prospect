import { redirect } from "next/navigation";

/** Ancienne console SaaS : l’application n’a qu’une organisation. */
export default function AdminPage() {
  redirect("/");
}
