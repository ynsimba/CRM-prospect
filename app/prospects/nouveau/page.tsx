import Shell from "@/components/Shell";
import ProspectForm from "@/components/ProspectForm";
import { requirePermission } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS } from "@/lib/permissions";
import { isSalesRole } from "@/lib/roles";

export default async function NewProspectPage() {
  const session = await requirePermission(PERMISSIONS.prospectsManage);
  const options = await getCrmOptions(session);
  const defaultStatusId = options.statuses.find((item) => item.slug === "opportunite")?.id;

  return (
    <Shell activeHref="/prospects/nouveau">
      <div className="prospect-entry">
        <h1 className="page-title">Ajouter un Prospect</h1>
        <p className="card-sub">Remplissez les champs du formulaire afin d’ajouter un nouveau prospect.</p>
        <ProspectForm
          statuses={options.statuses}
          sources={options.sources}
          tags={options.tags}
          companies={options.companies}
          owners={options.owners}
          defaultStatusId={defaultStatusId}
          defaultOwnerId={session.userId}
          lockOwner={isSalesRole(session.role)}
        />
      </div>
    </Shell>
  );
}
