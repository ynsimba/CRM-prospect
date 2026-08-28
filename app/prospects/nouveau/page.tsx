import Link from "next/link";
import Shell from "@/components/Shell";
import ProspectForm from "@/components/ProspectForm";
import { requirePermission } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS } from "@/lib/permissions";

export default async function NewProspectPage() {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const options = await getCrmOptions(session);
  const defaultStatusId = options.statuses.find((item) => item.slug === "nouveau")?.id;

  return (
    <Shell activeHref="/prospects/nouveau">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ajouter un prospect</h1>
          <p className="card-sub">Nouvelle fiche commerciale.</p>
        </div>
        <Link href="/prospects" className="table-action">
          Tous les prospects
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <article className="dash-card">
            <ProspectForm
              statuses={options.statuses}
              sources={options.sources}
              tags={options.tags}
              companies={options.companies}
              owners={options.owners}
              defaultStatusId={defaultStatusId}
              defaultOwnerId={session.userId}
            />
          </article>
        </div>
      </div>
    </Shell>
  );
}
