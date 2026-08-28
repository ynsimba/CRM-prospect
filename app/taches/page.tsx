import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import Shell from "@/components/Shell";
import TaskForm from "@/components/TaskForm";
import { advanceTaskAction } from "@/app/actions/activities";
import { nextTaskStatus, TASK_STATUS_LABELS, taskStatusPill } from "@/lib/activity-logic";
import { requirePermission } from "@/lib/auth";
import { PRIORITY_LABELS, fullName, priorityPillClass } from "@/lib/crm";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getPipelineOptions } from "@/lib/pipeline";
import { listTasks } from "@/lib/tasks";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; owner?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.activitiesRead);
  const isSales = session.role === "SALES";
  const canManage = roleHasPermission(session.role, PERMISSIONS.activitiesManage);
  const params = await searchParams;
  const status =
    params.status && Object.values(TaskStatus).includes(params.status as TaskStatus)
      ? (params.status as TaskStatus)
      : undefined;
  const ownerId = isSales ? session.userId : params.owner;
  const [tasks, options] = await Promise.all([
    listTasks(session, { q: params.q, status, ownerId }),
    getPipelineOptions(session),
  ]);

  return (
    <Shell activeHref="/taches">
      <div className="page-head">
        <div>
          <h1 className="page-title">{isSales ? "Mes tâches" : "Tâches"}</h1>
          <p className="card-sub">À faire, en cours, terminées — liées aux prospects et affaires.</p>
        </div>
      </div>

      <article className="dash-card" style={{ marginBottom: 16 }}>
        <form method="get" className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="login-field">
              Recherche
              <input name="q" defaultValue={params.q ?? ""} placeholder="Titre, prospect, affaire" />
            </label>
          </div>
          <div className="col-md-3">
            <label className="login-field">
              Statut
              <select name="status" defaultValue={params.status ?? ""}>
                <option value="">Tous</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isSales ? null : (
            <div className="col-md-3">
              <label className="login-field">
                Commercial
                <select name="owner" defaultValue={params.owner ?? ""}>
                  <option value="">Tous</option>
                  {options.owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="col-md-2">
            <button type="submit" className="btn-download">
              Filtrer
            </button>
          </div>
        </form>
      </article>

      <div className="row g-3">
        <div className={canManage ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card">
            {tasks.length === 0 ? (
              <p className="empty-copy">Aucune tâche pour ces critères.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tâche</th>
                      <th>Échéance</th>
                      <th>Priorité</th>
                      <th>Statut</th>
                      <th>Assigné</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id}>
                        <td>
                          <strong>{task.title}</strong>
                          <div className="muted-line">
                            {task.prospect ? (
                              <Link href={`/prospects/${task.prospect.id}`}>
                                {fullName(task.prospect.firstName, task.prospect.lastName)}
                              </Link>
                            ) : task.opportunity ? (
                              <Link href={`/pipeline/${task.opportunity.id}`}>{task.opportunity.name}</Link>
                            ) : (
                              (task.company?.name ?? "—")
                            )}
                          </div>
                        </td>
                        <td>
                          {task.dueAt
                            ? task.dueAt.toLocaleString("fr-CD", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td>
                          <span className={`status-pill ${priorityPillClass(task.priority)}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${taskStatusPill(task.status)}`}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                        </td>
                        <td>{task.owner.name}</td>
                        <td>
                          {canManage && nextTaskStatus(task.status) ? (
                            <form action={advanceTaskAction.bind(null, task.id)}>
                              <button type="submit" className="table-action">
                                {nextTaskStatus(task.status) === "IN_PROGRESS" ? "Démarrer" : "Terminer"}
                              </button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </div>
        {canManage ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Nouvelle tâche</h3>
              <TaskForm
                owners={isSales ? [] : options.owners}
                prospects={options.prospects}
                defaultOwnerId={session.userId}
              />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
