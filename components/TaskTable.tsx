import Link from "next/link";
import {
  advanceTaskAction,
  closeIncompleteTaskAction,
  saveTaskOwnerNoteAction,
} from "@/app/actions/activities";
import TaskDirectorNoteForm from "@/components/TaskDirectorNoteForm";
import { nextTaskStatus, TASK_STATUS_LABELS, taskStatusPill } from "@/lib/activity-logic";
import { PRIORITY_LABELS, fullName, priorityPillClass } from "@/lib/crm";
import { daysRemainingLabel } from "@/lib/safecheck";
import { relativeTimeLabel } from "@/lib/task-follow-logic";
import type { listTasks } from "@/lib/tasks";

type TaskRow = Awaited<ReturnType<typeof listTasks>>[number];

function taskCompany(task: TaskRow) {
  return (
    task.company?.name ??
    task.prospect?.company?.name ??
    (task.prospect ? fullName(task.prospect.firstName, task.prospect.lastName) : null) ??
    task.opportunity?.name ??
    "—"
  );
}

export default function TaskTable({
  tasks,
  canManage,
  showOwner = true,
  canDirectorComment = false,
}: {
  tasks: TaskRow[];
  canManage: boolean;
  showOwner?: boolean;
  canDirectorComment?: boolean;
}) {
  if (tasks.length === 0) {
    return <p className="empty-copy">Aucune tâche pour ces critères.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tâche</th>
            <th>Entreprise</th>
            <th>Date échéance</th>
            <th>Jours restants</th>
            <th>Statut</th>
            {showOwner ? <th>Assignée à</th> : null}
            <th>Assignée par</th>
            <th>Màj</th>
            <th>Commentaire directeur</th>
            <th>Commentaire commercial</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const remaining = daysRemainingLabel(task.dueAt);
            const overdue = remaining.startsWith("⚠");
            return (
              <tr key={task.id}>
                <td>{task.displayCode ?? "—"}</td>
                <td>
                  <strong>{task.title}</strong>
                  {task.priority !== "NORMAL" ? (
                    <div className="muted-line">
                      <span className={`status-pill ${priorityPillClass(task.priority)}`}>
                        {PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
                      </span>
                    </div>
                  ) : null}
                </td>
                <td>
                  {task.prospect ? (
                    <Link href={`/prospects/${task.prospect.id}`}>{taskCompany(task)}</Link>
                  ) : (
                    taskCompany(task)
                  )}
                </td>
                <td>
                  {task.dueAt
                    ? task.dueAt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </td>
                <td>
                  {remaining ? (
                    <span className={overdue ? "follow-alert" : "muted-line"}>{remaining}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <span className={`status-pill ${taskStatusPill(task.status)}`}>
                    {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                  </span>
                </td>
                {showOwner ? <td>{task.owner.name}</td> : null}
                <td>{task.assignedBy?.name ?? "—"}</td>
                <td>{relativeTimeLabel(task.updatedAt)}</td>
                <td>
                  {canDirectorComment ? (
                    <TaskDirectorNoteForm taskId={task.id} note={task.directorNote ?? ""} />
                  ) : (
                    (task.directorNote ?? "—")
                  )}
                </td>
                <td>{task.ownerNote ?? "—"}</td>
                <td>
                  <div className="task-row-actions">
                    {canManage && nextTaskStatus(task.status) ? (
                      <form action={advanceTaskAction.bind(null, task.id)}>
                        <button type="submit" className="table-action">
                          {nextTaskStatus(task.status) === "IN_PROGRESS" ? "Démarrer" : "Terminer"}
                        </button>
                      </form>
                    ) : null}
                    {canManage && task.status !== "DONE" && task.status !== "CANCELLED" ? (
                      <>
                        <form action={saveTaskOwnerNoteAction.bind(null, task.id)} className="task-note-form">
                          <input
                            name="ownerNote"
                            defaultValue={task.ownerNote ?? ""}
                            placeholder="Compte-rendu commercial"
                            aria-label="Commentaire commercial"
                          />
                          <button type="submit" className="table-action">
                            Envoyer
                          </button>
                        </form>
                        <form action={closeIncompleteTaskAction.bind(null, task.id)} className="task-note-form">
                          <input
                            name="ownerNote"
                            required
                            placeholder="Motif de clôture incomplète"
                            aria-label="Motif de clôture incomplète"
                          />
                          <button type="submit" className="table-action">
                            Clôturer incomplet
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
