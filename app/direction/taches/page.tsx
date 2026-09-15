import Link from "next/link";
import { TaskStatus } from "@prisma/client";
import Shell from "@/components/Shell";
import TaskTable from "@/components/TaskTable";
import LiveRefresh from "@/components/LiveRefresh";
import { requireDirector } from "@/lib/auth";
import { TASK_STATUS_LABELS } from "@/lib/activity-logic";
import { filterFollowTasks, followTasksHref, summarizeTaskFollowUp } from "@/lib/task-follow-logic";
import { listTasks } from "@/lib/tasks";
import { listSalesAgents } from "@/lib/users";

export default async function DirectorTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; status?: string; late?: string }>;
}) {
  const session = await requireDirector();
  const params = await searchParams;
  const status =
    params.status && Object.values(TaskStatus).includes(params.status as TaskStatus)
      ? (params.status as TaskStatus)
      : undefined;
  const overdue = params.late === "1";
  const owner = params.owner;
  const [allTasks, agents] = await Promise.all([
    listTasks(session, { ownerId: owner, salesOwners: true, sort: "live" }),
    listSalesAgents(session),
  ]);
  const summary = summarizeTaskFollowUp(allTasks);
  const tasks = filterFollowTasks(allTasks, { status: overdue ? undefined : status, overdue });

  const kpis = [
    {
      label: "À faire",
      value: summary.todo,
      tone: "navy",
      href: followTasksHref({ owner, status: status === "TODO" && !overdue ? undefined : "TODO" }),
      active: status === "TODO" && !overdue,
    },
    {
      label: "En cours",
      value: summary.inProgress,
      tone: "orange",
      href: followTasksHref({ owner, status: status === "IN_PROGRESS" && !overdue ? undefined : "IN_PROGRESS" }),
      active: status === "IN_PROGRESS" && !overdue,
    },
    {
      label: "Fait",
      value: summary.done,
      tone: "green",
      href: followTasksHref({ owner, status: status === "DONE" && !overdue ? undefined : "DONE" }),
      active: status === "DONE" && !overdue,
    },
    {
      label: "En retard",
      value: summary.overdue,
      tone: "red",
      href: followTasksHref({ owner, late: overdue ? undefined : "1" }),
      active: overdue,
    },
    {
      label: "Clôturé incomplet",
      value: summary.cancelled,
      tone: "brand",
      href: followTasksHref({ owner, status: status === "CANCELLED" && !overdue ? undefined : "CANCELLED" }),
      active: status === "CANCELLED" && !overdue,
    },
  ];

  return (
    <Shell activeHref="/direction/taches">
      <div className="follow-page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Suivie des tâches</h1>
            <p className="card-sub">
              Indicateurs branchés sur les {summary.total} tâches des commerciaux — clique un KPI pour filtrer la liste.
            </p>
          </div>
          <div className="page-head-actions">
            <LiveRefresh />
            <Link href="/direction/assignation" className="btn-download">
              Assigner une tâche
            </Link>
          </div>
        </div>

        <div className="metric-grid metric-grid-follow" style={{ marginBottom: 16 }}>
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className={`metric-box ${kpi.tone}${kpi.active ? " is-selected" : ""}`}
              aria-current={kpi.active ? "page" : undefined}
            >
              <span className="metric-label">{kpi.label}</span>
              <span className="metric-value">{kpi.value}</span>
            </Link>
          ))}
        </div>

        <article className="dash-card">
          <form method="get" className="follow-filters">
            <label className="login-field">
              Commercial
              <select name="owner" defaultValue={owner ?? ""}>
                <option value="">Tous les agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="login-field">
              Statut
              <select name="status" defaultValue={overdue ? "" : (status ?? "")}>
                <option value="">Tous</option>
                {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn-download">
              Filtrer
            </button>
          </form>
          {tasks.length === 0 ? (
            <p className="empty-copy">
              Aucune tâche pour ces critères.{" "}
              <Link href="/direction/assignation">Assigner une tâche à un commercial</Link>
            </p>
          ) : (
            <TaskTable tasks={tasks} canManage={false} canDirectorComment />
          )}
        </article>
      </div>
    </Shell>
  );
}
