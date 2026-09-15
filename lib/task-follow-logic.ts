import type { Role, TaskStatus } from "@prisma/client";
import { startOfDay } from "@/lib/activity-logic";
import { isDirectionRole } from "@/lib/roles";

export function canDirectorCommentOnAssignedTask(role: Role) {
  return isDirectionRole(role);
}

export type TaskFollowItem = {
  ownerId: string;
  status: TaskStatus;
  dueAt: Date | null;
  updatedAt: Date;
};

export function isOpenTaskOverdue(task: TaskFollowItem, now = new Date()) {
  if (task.status !== "TODO" && task.status !== "IN_PROGRESS") return false;
  if (!task.dueAt) return false;
  return startOfDay(task.dueAt).getTime() < startOfDay(now).getTime();
}

export function summarizeTaskFollowUp(tasks: TaskFollowItem[], now = new Date()) {
  let todo = 0;
  let inProgress = 0;
  let done = 0;
  let cancelled = 0;
  let overdue = 0;

  for (const task of tasks) {
    if (task.status === "TODO") todo += 1;
    if (task.status === "IN_PROGRESS") inProgress += 1;
    if (task.status === "DONE") done += 1;
    if (task.status === "CANCELLED") cancelled += 1;
    if (isOpenTaskOverdue(task, now)) overdue += 1;
  }

  return { todo, inProgress, done, cancelled, overdue, total: tasks.length };
}

export function filterFollowTasks<T extends TaskFollowItem>(
  tasks: T[],
  filter: { status?: TaskStatus; overdue?: boolean },
  now = new Date(),
) {
  return tasks.filter((task) => {
    if (filter.overdue) return isOpenTaskOverdue(task, now);
    if (filter.status) return task.status === filter.status;
    return true;
  });
}

export function followTasksHref(query: { owner?: string; status?: string; late?: string }) {
  const params = new URLSearchParams();
  if (query.owner) params.set("owner", query.owner);
  if (query.status) params.set("status", query.status);
  if (query.late) params.set("late", query.late);
  const search = params.toString();
  return search ? `/direction/taches?${search}` : "/direction/taches";
}

export function agentTaskLoads<T extends { id: string; name: string; team?: { name: string } | null }>(
  agents: T[],
  tasks: TaskFollowItem[],
) {
  return agents.map((agent) => {
    const owned = tasks.filter((task) => task.ownerId === agent.id);
    const open = owned.filter((task) => task.status === "TODO" || task.status === "IN_PROGRESS");
    return {
      id: agent.id,
      name: agent.name,
      team: agent.team?.name?.trim() || "Sans département",
      open: open.length,
      done: owned.filter((task) => task.status === "DONE").length,
      overdue: summarizeTaskFollowUp(owned).overdue,
    };
  });
}

export function relativeTimeLabel(date: Date, now = new Date()) {
  const seconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (seconds < 15) return "À l’instant";
  if (seconds < 60) return `Il y a ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}
