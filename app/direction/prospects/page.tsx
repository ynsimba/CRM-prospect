import Shell from "@/components/Shell";
import ProspectGrid from "@/components/ProspectGrid";
import { requireDirector } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { toProspectGridRow } from "@/lib/prospect-grid-row";
import { listProspects } from "@/lib/prospects";

export default async function DirectorProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireDirector();
  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const params = await searchParams;
  const [prospects, options] = await Promise.all([
    listProspects(session, { archived: false, statusId: params.status }),
    getCrmOptions(session),
  ]);

  return (
    <Shell activeHref="/direction/prospects">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tous les Prospect</h1>
          <p className="card-sub">
            Tous les prospects saisis par les agents — commente, réassigne et suis l’avancement.
          </p>
        </div>
      </div>

      <article className="dash-card">
        {prospects.length === 0 ? (
          <p className="empty-copy">Aucune entreprise en cours.</p>
        ) : (
          <ProspectGrid
            rows={prospects.map(toProspectGridRow)}
            statuses={options.statuses}
            owners={options.owners}
            density="medium"
            canManage={canManage}
            canReassign
          />
        )}
      </article>
    </Shell>
  );
}
