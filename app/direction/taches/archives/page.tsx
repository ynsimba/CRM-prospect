import Shell from "@/components/Shell";
import TaskTable from "@/components/TaskTable";
import LiveRefresh from "@/components/LiveRefresh";
import { requireDirector } from "@/lib/auth";
import { groupTasksByDepartment, listTasks } from "@/lib/tasks";

export default async function DirectorArchivedTasksPage() {
  const session = await requireDirector();
  const tasks = await listTasks(session, { closed: true });
  const groups = groupTasksByDepartment(tasks);

  return (
    <Shell activeHref="/direction/taches/archives">
      <div className="page-head">
        <div>
          <h1 className="page-title">Archives Task par département</h1>
          <p className="card-sub">Tâches faites ou clôturées incomplet, groupées par équipe.</p>
        </div>
        <LiveRefresh />
      </div>

      {groups.length === 0 ? (
        <article className="dash-card">
          <p className="empty-copy">Aucune tâche archivée.</p>
        </article>
      ) : (
        groups.map((group) => (
          <article key={group.label} className="dash-card" style={{ marginBottom: 16 }}>
            <h3>
              {group.label} <span className="muted-line">{group.items.length}</span>
            </h3>
            <TaskTable tasks={group.items} canManage={false} canDirectorComment />
          </article>
        ))
      )}
    </Shell>
  );
}
