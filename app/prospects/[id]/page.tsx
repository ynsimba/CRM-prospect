import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ConvertProspectForm from "@/components/ConvertProspectForm";
import ActivityForm from "@/components/ActivityForm";
import ActivityTimeline from "@/components/ActivityTimeline";
import TaskForm from "@/components/TaskForm";
import { advanceTaskAction } from "@/app/actions/activities";
import { updateProspectStatusAction } from "@/app/actions/prospects";
import { TASK_STATUS_LABELS, nextTaskStatus } from "@/lib/activity-logic";
import { requirePermission } from "@/lib/auth";
import {
  PRIORITY_LABELS,
  computeProspectScore,
  fullName,
  priorityPillClass,
  scoreBand,
  statusPillClass,
  whatsappHref,
} from "@/lib/crm";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getDefaultPipeline } from "@/lib/pipeline";
import { getProspect } from "@/lib/prospects";
import type { Row } from "@/lib/prisma";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const { id } = await params;
  const [prospect, options, pipeline] = await Promise.all([
    getProspect(session, id),
    getCrmOptions(session),
    getDefaultPipeline(session),
  ]);
  if (!prospect) {
    notFound();
  }

  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const canConvert = roleHasPermission(session.role, PERMISSIONS.pipelineManage);
  const canActivities = roleHasPermission(session.role, PERMISSIONS.activitiesManage);
  const hasOpenOpportunity = prospect.opportunities.some((item: Row) => item.status === "OPEN");
  const pipelineStages = pipeline?.stages ?? [];
  const wa = prospect.whatsapp ? whatsappHref(prospect.whatsapp) : null;
  const scoreDetail = computeProspectScore({
    email: prospect.email,
    phone: prospect.phone,
    whatsapp: prospect.whatsapp,
    companyId: prospect.companyId,
    jobTitle: prospect.jobTitle,
    priority: prospect.priority,
    tags: prospect.tags.map((item: Row) => item.tag.name),
    statusSlug: prospect.status.slug,
    activityTypes: prospect.activities.map((item: Row) => item.type),
    lastContactAt: prospect.lastContactAt,
    nextContactAt: prospect.nextContactAt,
  });

  return (
    <Shell activeHref="/prospects">
      <div className="page-head">
        <div>
          <h1 className="page-title">{fullName(prospect.firstName, prospect.lastName)}</h1>
          <p className="card-sub">
            {prospect.jobTitle ?? "Prospect"}
            {prospect.company ? ` · ${prospect.company.name}` : ""}
          </p>
        </div>
        <Link href="/prospects" className="table-action">
          Retour à la liste
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
                    <td>Code</td>
                    <td>{prospect.displayCode ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Statut</td>
                    <td>
                      <span className={`status-pill ${statusPillClass(prospect.status.slug, prospect.status.isConverted, prospect.status.isLost)}`}>
                        {prospect.status.name}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Priorité</td>
                    <td>
                      <span className={`status-pill ${priorityPillClass(prospect.priority)}`}>
                        {PRIORITY_LABELS[prospect.priority as keyof typeof PRIORITY_LABELS]}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Score</td>
                    <td>
                      {prospect.score} · {scoreBand(prospect.score)}
                      {scoreDetail.parts.length > 0 ? (
                        <ul className="score-parts">
                          {scoreDetail.parts.map((part) => (
                            <li key={part.label}>
                              <span>{part.label}</span>
                              <span className={part.points < 0 ? "pts-neg" : "pts-pos"}>
                                {part.points > 0 ? `+${part.points}` : part.points}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td>Source</td>
                    <td>{prospect.source?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Commercial</td>
                    <td>{prospect.owner?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Entreprise</td>
                    <td>
                      {prospect.company ? (
                        <Link href={`/entreprises/${prospect.company.id}`}>{prospect.company.name}</Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Contact lié</td>
                    <td>
                      {prospect.contact ? (
                        <Link href={`/contacts/${prospect.contact.id}`}>
                          {fullName(prospect.contact.firstName, prospect.contact.lastName)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>E-mail</td>
                    <td>{prospect.email ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Téléphone</td>
                    <td>{prospect.phone ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>WhatsApp</td>
                    <td>
                      {wa ? (
                        <a href={wa} target="_blank" rel="noreferrer">
                          {prospect.whatsapp}
                        </a>
                      ) : (
                        (prospect.whatsapp ?? "—")
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Ville</td>
                    <td>
                      {[prospect.city, prospect.country].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Tags</td>
                    <td>
                      {prospect.tags.length
                        ? prospect.tags.map((item: Row) => item.tag.name).join(", ")
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Prochain contact</td>
                    <td>
                      {prospect.nextContactAt
                        ? prospect.nextContactAt.toLocaleString("fr-CD", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </td>
                  </tr>
                  <tr>
                    <td>Commentaire statut</td>
                    <td>{prospect.statusComment ?? "—"}</td>
                  </tr>
                  <tr>
                    <td>Notes</td>
                    <td>{prospect.notes ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <div className="col-12 col-xl-4">
          {canManage ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Changer le statut</h3>
              <form action={updateProspectStatusAction.bind(null, prospect.id)} className="product-form">
                <label className="login-field">
                  Statut
                  <select name="statusId" defaultValue={prospect.statusId}>
                    {options.statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="login-field">
                  Commentaire statut
                  <textarea name="statusComment" rows={2} defaultValue={prospect.statusComment ?? ""} />
                </label>
                <button type="submit" className="btn-download">
                  Enregistrer
                </button>
              </form>
            </article>
          ) : null}
          {canConvert ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Convertir</h3>
              {hasOpenOpportunity ? (
                <p className="empty-copy">Une opportunité ouverte existe déjà pour ce prospect.</p>
              ) : (
                <ConvertProspectForm
                  prospectId={prospect.id}
                  defaultName={
                    prospect.company
                      ? `${prospect.company.name} — ${fullName(prospect.firstName, prospect.lastName)}`
                      : fullName(prospect.firstName, prospect.lastName)
                  }
                  stages={pipelineStages}
                />
              )}
              {prospect.opportunities.length > 0 ? (
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table className="data-table">
                    <tbody>
                      {prospect.opportunities.map((item: Row) => (
                        <tr key={item.id}>
                          <td>
                            <Link href={`/pipeline/${item.id}`}>{item.name}</Link>
                          </td>
                          <td>{item.stage.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </article>
          ) : null}
          {canActivities ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Logger une activité</h3>
              <ActivityForm
                prospectId={prospect.id}
                companyId={prospect.companyId ?? undefined}
                showNextContact
              />
            </article>
          ) : null}
          {canActivities ? (
            <article className="dash-card" style={{ marginBottom: 16 }}>
              <h3>Nouvelle tâche</h3>
              <TaskForm
                prospectId={prospect.id}
                companyId={prospect.companyId ?? undefined}
                owners={options.owners}
                defaultOwnerId={session.userId}
              />
            </article>
          ) : null}
          <article className="dash-card" style={{ marginBottom: 16 }}>
            <h3>Historique des statuts</h3>
            {prospect.statusHistory.length === 0 ? (
              <p className="empty-copy">Aucun changement enregistré.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <tbody>
                    {prospect.statusHistory.map((item: Row) => (
                      <tr key={item.id}>
                        <td>{item.displayCode ?? "—"}</td>
                        <td>
                          <strong>{item.statusName}</strong>
                          <div className="muted-line">
                            {item.occurredAt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" })}
                            {item.actor?.name ? ` · ${item.actor.name}` : ""}
                          </div>
                        </td>
                        <td>{item.comment ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
          <article className="dash-card" style={{ marginBottom: 16 }}>
            <h3>Activités</h3>
            <ActivityTimeline activities={prospect.activities} />
          </article>
          <article className="dash-card">
            <h3>Tâches</h3>
            {prospect.tasks.length === 0 ? (
              <p className="empty-copy">Aucune tâche liée.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <tbody>
                    {prospect.tasks.map((task: Row) => (
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
