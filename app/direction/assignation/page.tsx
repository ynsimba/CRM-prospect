import Shell from "@/components/Shell";
import TaskForm from "@/components/TaskForm";
import TaskTable from "@/components/TaskTable";
import LiveRefresh from "@/components/LiveRefresh";
import { requireDirector } from "@/lib/auth";
import { getPipelineOptions } from "@/lib/pipeline";
import { agentTaskLoads } from "@/lib/task-follow-logic";
import { listTasks } from "@/lib/tasks";
import { listSalesAgents } from "@/lib/users";

export default async function DirectorAssignationPage() {
  const session = await requireDirector();
  const [agents, tasks, options] = await Promise.all([
    listSalesAgents(session),
    listTasks(session, { sort: "live" }),
    getPipelineOptions(session),
  ]);
  const loads = agentTaskLoads(agents, tasks);
  const openTasks = tasks.filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS");

  return (
    <Shell activeHref="/direction/assignation">
      <div className="page-head">
        <div>
          <h1 className="page-title">Assignation Tâches</h1>
          <p className="card-sub">Assigne une tâche à un agent commercial. Elle apparaît immédiatement dans Mes tâches.</p>
        </div>
        <LiveRefresh label="Agents synchronisés" />
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-5">
          <article className="dash-card">
            <h3>Nouvelle tâche</h3>
            {agents.length === 0 ? (
              <p className="empty-copy">Aucun agent commercial actif à qui assigner.</p>
            ) : (
              <TaskForm
                owners={agents}
                prospects={options.prospects}
                requireOwner
                submitLabel="Assigner au commercial"
              />
            )}
          </article>
        </div>
        <div className="col-12 col-xl-7">
          <article className="dash-card" style={{ marginBottom: 16 }}>
            <h3>Agents commerciaux</h3>
            {loads.length === 0 ? (
              <p className="empty-copy">Aucun délégué commercial.</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Commercial</th>
                      <th>Département</th>
                      <th>Ouvertes</th>
                      <th>En retard</th>
                      <th>Faites</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((agent) => (
                      <tr key={agent.id}>
                        <td>{agent.name}</td>
                        <td>{agent.team}</td>
                        <td>{agent.open}</td>
                        <td>{agent.overdue}</td>
                        <td>{agent.done}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
          <article className="dash-card">
            <h3>Tâches ouvertes</h3>
            <TaskTable tasks={openTasks} canManage={false} canDirectorComment />
          </article>
        </div>
      </div>
    </Shell>
  );
}
