import Shell from "@/components/Shell";
import ProspectForm from "@/components/ProspectForm";
import StatusKanban, { type StatusKanbanColumn } from "@/components/StatusKanban";
import TaskTable from "@/components/TaskTable";
import { requirePermission } from "@/lib/auth";
import { getCrmOptions } from "@/lib/options";
import { PERMISSIONS, roleHasPermission } from "@/lib/permissions";
import { listProspects } from "@/lib/prospects";
import { SAFECHECK_STATUSES } from "@/lib/safecheck";
import { listTasks } from "@/lib/tasks";

export default async function CommercialInterfacePage() {
  const session = await requirePermission(PERMISSIONS.prospectsRead);
  const canManage = roleHasPermission(session.role, PERMISSIONS.prospectsManage);
  const canUpdateTasks = roleHasPermission(session.role, PERMISSIONS.activitiesManage);
  const [prospects, tasks, options] = await Promise.all([
    listProspects(session, { archived: false }),
    listTasks(session),
    getCrmOptions(session),
  ]);
  const defaultStatusId = options.statuses.find((item) => item.slug === "opportunite")?.id;
  const overdue = tasks.filter(
    (task) =>
      task.dueAt &&
      task.dueAt.getTime() < Date.now() &&
      (task.status === "TODO" || task.status === "IN_PROGRESS"),
  );
  const columns: StatusKanbanColumn[] = SAFECHECK_STATUSES.map((spec) => {
    const status = options.statuses.find((item) => item.slug === spec.slug);
    return {
      id: status?.id ?? spec.slug,
      name: spec.name,
      slug: spec.slug,
      isConverted: spec.isConverted,
      isLost: spec.isLost,
      items: prospects
        .filter((prospect) => prospect.status.slug === spec.slug)
        .map((prospect) => ({
          id: prospect.id,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          companyName: prospect.company?.name ?? null,
          ownerName: prospect.owner?.name ?? null,
          href: `/prospects/${prospect.id}`,
        })),
    };
  });

  return (
    <Shell activeHref="/interface">
      <div className="page-head">
        <div>
          <h1 className="page-title">Interface commerciale</h1>
          <p className="card-sub">
            Ajouter une entreprise, faire glisser le statut, suivre vos tâches. {overdue.length} tâche(s) en retard.
          </p>
        </div>
      </div>

      <div className="row g-3" style={{ marginBottom: 16 }}>
        <div className="col-12 col-xl-4">
          <article className="dash-card">
            <h3>Ajouter un prospect</h3>
            <p className="card-sub">Statut initial Opportunité · commercial = vous.</p>
            <ProspectForm
              statuses={options.statuses}
              sources={options.sources}
              tags={options.tags}
              companies={options.companies}
              owners={options.owners}
              defaultStatusId={defaultStatusId}
              defaultOwnerId={session.userId}
              lockOwner
              lockStatus
            />
          </article>
        </div>
        <div className="col-12 col-xl-8">
          <article className="dash-card">
            <h3>Kanban par statut</h3>
            <p className="card-sub">Glisser une entreprise d’une étape à l’autre.</p>
            <StatusKanban columns={columns} canManage={canManage} />
          </article>
        </div>
      </div>

      <article className="dash-card">
        <h3>Mes tâches</h3>
        <p className="card-sub">Indicateur de retard selon l’échéance.</p>
        <TaskTable tasks={tasks} canManage={canUpdateTasks} showOwner={false} />
      </article>
    </Shell>
  );
}
