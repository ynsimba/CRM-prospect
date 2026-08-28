import Link from "next/link";
import Shell from "@/components/Shell";
import ContactForm from "@/components/ContactForm";
import { requirePermission } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewContactPage() {
  const session = await requirePermission(PERMISSIONS.companiesManage);
  const options = await getCrmOptions(session);

  return (
    <Shell activeHref="/contacts/nouveau">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ajouter contact</h1>
          <p className="card-sub">Nouvel interlocuteur, rattaché ou non à une entreprise.</p>
        </div>
        {session.role === "SALES" ? null : (
          <Link href="/contacts" className="table-action">
            Tous les contacts
          </Link>
        )}
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <ContactForm companies={options.companies} />
          </article>
        </div>
      </div>
    </Shell>
  );
}
