import { TaskStatus } from "@prisma/client";
import Shell from "@/components/Shell";
import TaskForm from "@/components/TaskForm";
import TaskTable from "@/components/TaskTable";
import LiveRefresh from "@/components/LiveRefresh";
import { requirePermission } from "@/lib/auth";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { getPipelineOptions } from "@/lib/pipeline";
import { TASK_STATUS_LABELS } from "@/lib/activity-logic";
import { listTasks } from "@/lib/tasks";
import { listSalesAgents } from "@/lib/users";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; owner?: string }>;
}) {
  const session = await requirePermission(PERMISSIONS.activitiesRead);
  const isSales = session.role === "SALES";
  const canAssign = roleHasPermission(session.role, PERMISSIONS.activitiesManage) && !isSales;
  const canUpdate = roleHasPermission(session.role, PERMISSIONS.activitiesManage);
  const params = await searchParams;
  const status =
    params.status && Object.values(TaskStatus).includes(params.status as TaskStatus)
      ? (params.status as TaskStatus)
      : undefined;
  const ownerId = isSales ? session.userId : params.owner;
  const [tasks, options, agents] = await Promise.all([
    listTasks(session, { q: params.q, status, ownerId, sort: isSales ? "live" : "due" }),
    getPipelineOptions(session),
    canAssign ? listSalesAgents(session) : Promise.resolve([]),
  ]);

  return (
    <Shell activeHref="/taches">
      <div className="page-head">
        <div>
          <h1 className="page-title">{isSales ? "Mes tâches" : "Tâches"}</h1>
          <p className="card-sub">
            {isSales
              ? "Tâches reçues de la direction — démarre, commente et clôture en temps réel."
              : "À faire, en cours, fait, clôturé incomplet — jours restants et double commentaire."}
          </p>
        </div>
        {isSales ? <LiveRefresh label="Nouvelles tâches" /> : null}
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
        <div className={canAssign ? "col-12 col-xl-8" : "col-12"}>
          <article className="dash-card">
            <TaskTable tasks={tasks} canManage={canUpdate} showOwner={!isSales} />
          </article>
        </div>
        {canAssign ? (
          <div className="col-12 col-xl-4">
            <article className="dash-card">
              <h3>Assigner une tâche</h3>
              <TaskForm
                owners={agents}
                prospects={options.prospects}
                requireOwner
                submitLabel="Assigner au commercial"
              />
            </article>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
