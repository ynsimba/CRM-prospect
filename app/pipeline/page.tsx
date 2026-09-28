import Shell from "@/components/Shell";
import KanbanBoard, { type KanbanColumn } from "@/components/KanbanBoard";
import OpportunityForm from "@/components/OpportunityForm";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getPipelineBoard, getPipelineOptions } from "@/lib/pipeline";
import type { Row } from "@/lib/prisma";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.pipelineRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.pipelineManage);
  const { owner } = await searchParams;
  const [board, options] = await Promise.all([
    getPipelineBoard(session, owner || undefined),
    getPipelineOptions(session),
  ]);

  const columns: KanbanColumn[] = (board?.columns ?? []).map((column: Row) => ({
    id: column.id,
    name: column.name,
    probability: column.probability,
    isWon: column.isWon,
    isLost: column.isLost,
    total: column.total,
    weighted: column.weighted,
    opportunities: column.opportunities.map((item: Row) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      probability: item.probability,
      companyName: item.company?.name ?? null,
      ownerName: item.owner?.name ?? null,
    })),
  }));

  return (
    <Shell activeHref="/pipeline">
      <div className="page-head">
        <div>
          <h1 className="page-title">Pipeline</h1>
          <p className="card-sub">
            {board
              ? `${board.totals.openCount} opportunité${board.totals.openCount > 1 ? "s" : ""} ouverte${board.totals.openCount > 1 ? "s" : ""} · ${board.totals.wonCount} gagnée${board.totals.wonCount > 1 ? "s" : ""}`
              : "Aucun pipeline par défaut."}
          </p>
        </div>
      </div>

      {board ? (
        <>
          <article className="dash-card" style={{ marginBottom: 16 }}>
            <form method="get" className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="login-field">
                  Commercial
                  <select name="owner" defaultValue={owner ?? ""}>
                    <option value="">Tous</option>
                    {options.owners.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn-download">
                  Filtrer
                </button>
              </div>
            </form>
          </article>

          <KanbanBoard columns={columns} canManage={canManage} />
        </>
      ) : (
        <article className="dash-card">
          <p className="empty-copy">Crée un pipeline dans les paramètres d’organisation.</p>
        </article>
      )}

      {canManage && options.pipeline ? (
        <div className="row g-3" style={{ marginTop: 16 }}>
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Nouvelle opportunité</h3>
              <OpportunityForm
                stages={options.pipeline.stages}
                companies={options.companies}
                owners={options.owners}
                prospects={options.prospects}
                defaultOwnerId={session.userId}
              />
            </article>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
