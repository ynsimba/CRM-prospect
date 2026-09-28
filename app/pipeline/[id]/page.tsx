import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ActivityForm from "@/components/ActivityForm";
import ActivityTimeline from "@/components/ActivityTimeline";
import TaskForm from "@/components/TaskForm";
import { advanceTaskAction } from "@/app/actions/activities";
import { moveOpportunityFormAction } from "@/app/actions/pipeline";
import { TASK_STATUS_LABELS, nextTaskStatus } from "@/lib/activity-logic";
import { requirePermission } from "@/lib/auth";
import { fullName } from "@/lib/crm";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getDefaultPipeline, getOpportunity, getPipelineOptions } from "@/lib/pipeline";
import { stagePillClass } from "@/lib/pipeline-logic";
import type { Row } from "@/lib/prisma";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.pipelineRead);
  const { id } = await params;
  const [opportunity, pipeline, options] = await Promise.all([
    getOpportunity(session, id),
    getDefaultPipeline(session),
    getPipelineOptions(session),
  ]);
  if (!opportunity) {
    notFound();
  }

  const canManage = roleHasPermission(session.role, PERMISSIONS.pipelineManage);
  const canActivities = roleHasPermission(session.role, PERMISSIONS.activitiesManage);

  return (
    <Shell activeHref="/pipeline">
      <div className="page-head">
        <div>
          <h1 className="page-title">{opportunity.name}</h1>
          <p className="card-sub">
            {opportunity.pipeline.name} · {opportunity.stage.name}
          </p>
        </div>
        <Link href="/pipeline" className="table-action">
          Retour au Kanban
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-8">
          <article className="dash-card">
            <h3>Fiche</h3>
            <div className="table-wrap">
              <table className="data-table">
                <tbody>
                  <tr>
                    <td>Étape</td>
                    <td>
                      <span className={`status-pill ${stagePillClass(opportunity.stage)}`}>
                        {opportunity.stage.name}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Statut</td>
                    <td>
                      {opportunity.status === "WON"
                        ? "Gagnée"
                        : opportunity.status === "LOST"
                          ? "Perdue"
                          : "Ouverte"}
                    </td>
                  </tr>
                  <tr>
                    <td>Probabilité</td>
                    <td>{opportunity.probability}%</td>
                  </tr>
                  <tr>
                    <td>Commercial</td>
                    <td>{opportunity.owner?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Entreprise</td>
                    <td>
                      {opportunity.company ? (
                        <Link href={`/entreprises/${opportunity.company.id}`}>
                          {opportunity.company.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Prospect</td>
                    <td>
                      {opportunity.prospect ? (
                        <Link href={`/prospects/${opportunity.prospect.id}`}>
                          {fullName(opportunity.prospect.firstName, opportunity.prospect.lastName)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Contact</td>
                    <td>
                      {opportunity.contact
                        ? fullName(opportunity.contact.firstName, opportunity.contact.lastName)
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Clôture prévue</td>
                    <td>
                      {opportunity.expectedCloseAt
                        ? opportunity.expectedCloseAt.toLocaleDateString("fr-CD")
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Notes</td>
                    <td>{opportunity.description ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <article className="dash-card" style={{ marginTop: 16 }}>
            <h3>Activités</h3>
            <ActivityTimeline activities={opportunity.activities} />
          </article>
        </div>

        <div className="col-12 col-xl-4">
          {canManage && pipeline ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Déplacer</h3>
              <form action={moveOpportunityFormAction.bind(null, opportunity.id)} className="product-form">
                <label className="login-field">
                  Étape
                  <select name="stageId" defaultValue={opportunity.stageId}>
                    {pipeline.stages.map((stage: Row) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} ({stage.probability}%)
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn-download">
                  Enregistrer
                </button>
              </form>
            </article>
          ) : null}
          {canActivities ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Logger une activité</h3>
              <ActivityForm
                opportunityId={opportunity.id}
                prospectId={opportunity.prospectId ?? undefined}
                companyId={opportunity.companyId ?? undefined}
                showNextContact={Boolean(opportunity.prospectId)}
              />
            </article>
          ) : null}
          {canActivities ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Nouvelle tâche</h3>
              <TaskForm
                opportunityId={opportunity.id}
                prospectId={opportunity.prospectId ?? undefined}
                companyId={opportunity.companyId ?? undefined}
                owners={options.owners}
                defaultOwnerId={session.userId}
              />
            </article>
          ) : null}
          <article className="dash-card">
            <h3>Tâches</h3>
            {opportunity.tasks.length === 0 ? (
              <p className="empty-copy">Aucune tâche liée.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <tbody>
                    {opportunity.tasks.map((task: Row) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          <div className="muted-line">
                            {task.dueAt
                              ? task.dueAt.toLocaleString("fr-CD", { dateStyle: "short" })
                              : "Sans date"}
                          </div>
                        </td>
                        <td>
                          {canActivities && nextTaskStatus(task.status) ? (
                            <form action={advanceTaskAction.bind(null, task.id)}>
                              <button type="submit" className="table-action">
                                {nextTaskStatus(task.status) === "IN_PROGRESS" ? "Démarrer" : "Terminer"}
                              </button>
                            </form>
                          ) : (
                            TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
      </div>
    </Shell>
  );
}
