"use server";

import { ActivityType, ProspectPriority, TaskStatus, TaskType } from "@/lib/enums";
import { revalidatePath } from "next/cache";
import { requireDirector, requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { createActivity } from "@/lib/activities";
import { emptyToNull, readOptionalId } from "@/lib/crm";
import { PERMISSIONS } from "@/lib/permissions";
import { createTask, advanceTask, setTaskStatus, setTaskOwnerNote, setTaskDirectorNote } from "@/lib/tasks";

export type ActivityFormState = {
  error?: string;
  success?: string;
};

const ACTIVITY_TYPES = new Set<string>(Object.values(ActivityType));
const TASK_TYPES = new Set<string>(Object.values(TaskType));

function readTaskType(value: FormDataEntryValue | null): TaskType {
  const raw = String(value ?? "TASK");
  return TASK_TYPES.has(raw) ? (raw as TaskType) : TaskType.TASK;
}

function readActivityType(value: FormDataEntryValue | null): ActivityType {
  const raw = String(value ?? "NOTE");
  return ACTIVITY_TYPES.has(raw) ? (raw as ActivityType) : ActivityType.NOTE;
}

function readPriority(value: FormDataEntryValue | null): ProspectPriority {
  const raw = String(value ?? "NORMAL");
  if (raw === "LOW" || raw === "HIGH" || raw === "URGENT") return raw;
  return ProspectPriority.NORMAL;
}

function readDateTime(value: FormDataEntryValue | null, fallback?: Date) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date invalide.");
  }
  return date;
}

function revalidateWork(paths: string[]) {
  for (const path of paths) revalidatePath(path);
  revalidatePath("/");
  revalidatePath("/taches");
  revalidatePath("/relances");
  revalidatePath("/prospects");
  revalidatePath("/interface");
  revalidatePath("/direction");
  revalidatePath("/direction/assignation");
  revalidatePath("/direction/taches");
  revalidatePath("/direction/taches/departement");
  revalidatePath("/direction/taches/archives");
  revalidatePath("/pipeline");
  revalidatePath("/notifications");
}

export async function createActivityAction(
  _prev: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const session = await requirePermission(PERMISSIONS.activitiesManage);

  try {
    const durationRaw = String(formData.get("durationMin") ?? "").trim();
    const durationMin = durationRaw ? Number(durationRaw) : undefined;
    if (durationMin !== undefined && (!Number.isFinite(durationMin) || durationMin < 0)) {
      throw new Error("Durée invalide.");
    }
    const activity = await createActivity(session, {
      type: readActivityType(formData.get("type")),
      comment: emptyToNull(formData.get("comment")) ?? undefined,
      outcome: emptyToNull(formData.get("outcome")) ?? undefined,
      durationMin,
      occurredAt: readDateTime(formData.get("occurredAt")),
      prospectId: readOptionalId(formData.get("prospectId")),
      companyId: readOptionalId(formData.get("companyId")),
      opportunityId: readOptionalId(formData.get("opportunityId")),
      nextContactAt: readDateTime(formData.get("nextContactAt")),
    });
    await auditAs(session, {
      action: "activity.create",
      entity: "Activity",
      entityId: activity.id,
      summary: `Activité ${activity.type}`,
    });
    revalidateWork([
      activity.prospectId ? `/prospects/${activity.prospectId}` : "",
      activity.opportunityId ? `/pipeline/${activity.opportunityId}` : "",
    ].filter(Boolean));
    return { success: "Activité enregistrée." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d’enregistrer l’activité.",
    };
  }
}

export async function createTaskAction(
  _prev: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const session = await requirePermission(PERMISSIONS.activitiesManage);

  try {
    const task = await createTask(session, {
      title: String(formData.get("title") ?? ""),
      type: readTaskType(formData.get("type")),
      description: emptyToNull(formData.get("description")) ?? undefined,
      directorNote: emptyToNull(formData.get("directorNote")) ?? undefined,
      ownerNote: emptyToNull(formData.get("ownerNote")) ?? undefined,
      priority: readPriority(formData.get("priority")),
      dueAt: readDateTime(formData.get("dueAt")),
      ownerId: readOptionalId(formData.get("ownerId")),
      prospectId: readOptionalId(formData.get("prospectId")),
      companyId: readOptionalId(formData.get("companyId")),
      opportunityId: readOptionalId(formData.get("opportunityId")),
    });
    await auditAs(session, {
      action: "task.create",
      entity: "Task",
      entityId: task.id,
      summary: `Tâche ${task.title}`,
    });
    revalidateWork([
      task.prospectId ? `/prospects/${task.prospectId}` : "",
      task.opportunityId ? `/pipeline/${task.opportunityId}` : "",
    ].filter(Boolean));
    return { success: "Tâche assignée au commercial." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible de créer la tâche.",
    };
  }
}

export async function advanceTaskAction(taskId: string) {
  const session = await requirePermission(PERMISSIONS.activitiesManage);
  const task = await advanceTask(session, taskId);
  await auditAs(session, {
    action: "task.advance",
    entity: "Task",
    entityId: task.id,
    summary: `${task.title} → ${task.status}`,
  });
  revalidateWork([
    task.prospectId ? `/prospects/${task.prospectId}` : "",
    task.opportunityId ? `/pipeline/${task.opportunityId}` : "",
  ].filter(Boolean));
}

export async function saveTaskOwnerNoteAction(taskId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.activitiesManage);
  const task = await setTaskOwnerNote(
    session,
    taskId,
    emptyToNull(formData.get("ownerNote")) ?? "",
  );
  await auditAs(session, {
    action: "task.comment",
    entity: "Task",
    entityId: task.id,
    summary: `${task.title} — compte-rendu`,
  });
  revalidateWork([
    task.prospectId ? `/prospects/${task.prospectId}` : "",
    task.opportunityId ? `/pipeline/${task.opportunityId}` : "",
  ].filter(Boolean));
}

export async function saveTaskDirectorNoteAction(taskId: string, formData: FormData) {
  const session = await requireDirector();
  const task = await setTaskDirectorNote(session, taskId, emptyToNull(formData.get("directorNote")));
  await auditAs(session, {
    action: "task.directorComment",
    entity: "Task",
    entityId: task.id,
    summary: `${task.title} — commentaire direction`,
  });
  revalidateWork([
    task.prospectId ? `/prospects/${task.prospectId}` : "",
    task.opportunityId ? `/pipeline/${task.opportunityId}` : "",
  ].filter(Boolean));
}

export async function closeIncompleteTaskAction(taskId: string, formData: FormData) {
  const session = await requirePermission(PERMISSIONS.activitiesManage);
  const task = await setTaskStatus(
    session,
    taskId,
    TaskStatus.CANCELLED,
    emptyToNull(formData.get("ownerNote")) ?? undefined,
  );
  await auditAs(session, {
    action: "task.incomplete",
    entity: "Task",
    entityId: task.id,
    summary: `${task.title} → clôturé incomplet`,
  });
  revalidateWork([
    task.prospectId ? `/prospects/${task.prospectId}` : "",
    task.opportunityId ? `/pipeline/${task.opportunityId}` : "",
  ].filter(Boolean));
}
