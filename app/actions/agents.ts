"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auditAs } from "@/lib/audit";
import { formatAgentName } from "@/lib/agent-logic";
import {
  ASSIGNMENT_MODE_LABELS,
  GOAL_METRICS,
  emptyTargets,
  parseAgentStatus,
  parseAssignmentMode,
} from "@/lib/agent-cockpit-logic";
import {
  assignProspects,
  createAgent,
  deleteAgent,
  requireAgentAdmin,
  requireAgentScope,
  setAgentStatus,
  updateAgent,
  upsertGoalTargets,
  type AgentInput,
} from "@/lib/agents";
import { parseWelcomeCivility } from "@/lib/crm";
import type { AgentStatus } from "@/lib/enums";

export type AgentFormState = {
  error?: string;
  success?: string;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function message(error: unknown, fallback: string): AgentFormState {
  return { error: error instanceof Error ? error.message : fallback };
}

function revalidateModule(id?: string) {
  revalidatePath("/direction/agents", "layout");
  if (id) revalidatePath(`/direction/agents/${id}`);
  revalidatePath("/direction/assignation");
  revalidatePath("/utilisateurs");
  revalidatePath("/equipe");
}

function readAgent(formData: FormData): AgentInput {
  const photo = formData.get("photoUrl");
  return {
    name: formatAgentName(text(formData, "firstName"), text(formData, "lastName")),
    email: text(formData, "email"),
    phone: text(formData, "phone") || undefined,
    civility: parseWelcomeCivility(formData.get("civility")),
    teamId: text(formData, "teamId") || null,
    zoneId: text(formData, "zoneId") || null,
    supervisorId: text(formData, "supervisorId") || null,
    matricule: text(formData, "matricule"),
    jobTitle: text(formData, "jobTitle"),
    hiredAt: text(formData, "hiredAt") || null,
    status: parseAgentStatus(formData.get("status")),
    role: formData.get("role") === "TEAM_LEAD" ? "TEAM_LEAD" : "SALES",
    // Absent field = keep the current photo; empty string = remove it.
    photoUrl: photo === null ? undefined : String(photo),
    password: String(formData.get("password") ?? ""),
  };
}

/* ------------------------------------------------------------------ agents */

export async function createAgentAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const scope = await requireAgentAdmin();
  try {
    const agent = await createAgent(scope, readAgent(formData));
    await auditAs(scope.session, {
      action: "agent.create",
      entity: "User",
      entityId: agent.id,
      summary: `Création de l’agent commercial ${agent.name} (${agent.email})`,
    });
    revalidateModule();
    return { success: `${agent.name} a été ajouté.` };
  } catch (error) {
    return message(error, "Impossible de créer l’agent.");
  }
}

export async function updateAgentAction(id: string, _prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const scope = await requireAgentAdmin();
  try {
    const agent = await updateAgent(scope, id, readAgent(formData));
    await auditAs(scope.session, {
      action: "agent.update",
      entity: "User",
      entityId: agent.id,
      summary: `Modification de la fiche de ${agent.name}`,
    });
    revalidateModule(id);
    return { success: "Modifications enregistrées." };
  } catch (error) {
    return message(error, "Impossible d’enregistrer.");
  }
}

export async function setAgentStatusAction(id: string, status: AgentStatus) {
  const scope = await requireAgentAdmin();
  const agent = await setAgentStatus(scope, id, status);
  const labels = { ACTIVE: "réactivé", SUSPENDED: "suspendu", INACTIVE: "désactivé" } as const;
  await auditAs(scope.session, {
    action: `agent.status.${status.toLowerCase()}`,
    entity: "User",
    entityId: agent.id,
    summary: `${agent.name} ${labels[status]}`,
  });
  revalidateModule(id);
}

export async function deleteAgentAction(id: string): Promise<AgentFormState> {
  const scope = await requireAgentAdmin();
  try {
    const agent = await deleteAgent(scope, id);
    await auditAs(scope.session, {
      action: "agent.delete",
      entity: "User",
      entityId: id,
      summary: `Suppression de l’agent commercial ${agent.name} (${agent.email})`,
    });
  } catch (error) {
    return message(error, "Impossible de supprimer l’agent.");
  }
  revalidateModule();
  redirect("/direction/agents/liste");
}

/* ------------------------------------------------------------------ assignment */

export async function assignProspectsAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const scope = await requireAgentScope();
  const prospectIds = formData.getAll("prospectIds").map(String);
  const agentId = text(formData, "agentId");
  if (!agentId) return { error: "Choisis l’agent qui reçoit les prospects." };
  const reassign = formData.get("reassign") === "1";
  try {
    const result = await assignProspects(scope, {
      prospectIds,
      agentId: agentId === "auto" ? "auto" : agentId,
      mode: parseAssignmentMode(formData.get("mode")),
      reason: text(formData, "reason"),
      reassign,
    });
    const target = result.agent?.name ?? `distribution automatique (${ASSIGNMENT_MODE_LABELS[result.mode]})`;
    const plural = result.moved > 1 ? "s" : "";
    await auditAs(scope.session, {
      action: reassign ? "prospect.reassign" : "prospect.assign",
      entity: "Prospect",
      summary: `${reassign ? "Réaffecter" : "Affecter"} ${result.moved} prospect${plural} à ${target}`,
    });
    revalidateModule();
    revalidatePath("/prospects");
    if (result.moved === 0) return { success: "Aucun changement : ces prospects étaient déjà chez cet agent." };
    return { success: `${result.moved} prospect${plural} ${reassign ? "réaffecté" : "affecté"}${plural} à ${target}.` };
  } catch (error) {
    return message(error, "Affectation impossible.");
  }
}

/* ------------------------------------------------------------------ goals */

export async function saveGoalsAction(_prev: AgentFormState, formData: FormData): Promise<AgentFormState> {
  const scope = await requireAgentScope();
  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  const userId = text(formData, "userId");
  const teamId = text(formData, "teamId");
  if (!userId && !teamId) return { error: "Objectif sans destinataire." };
  const targets = emptyTargets();
  for (const metric of GOAL_METRICS) {
    const value = Number(String(formData.get(metric.target) ?? "0").replace(/\s/g, ""));
    if (!Number.isFinite(value) || value < 0) return { error: `${metric.label} : valeur invalide.` };
    targets[metric.target] = Math.round(value);
  }
  try {
    await upsertGoalTargets(scope, userId ? { userId } : { teamId }, year, month, targets);
    const summary = GOAL_METRICS.map((metric) => `${metric.label} ${targets[metric.target]}`).join(", ");
    await auditAs(scope.session, {
      action: "goal.update",
      entity: "Goal",
      entityId: userId || teamId,
      summary: `Objectifs ${String(month).padStart(2, "0")}/${year} : ${summary}`,
    });
    revalidateModule(userId || undefined);
    return { success: "Objectifs enregistrés." };
  } catch (error) {
    return message(error, "Impossible d’enregistrer les objectifs.");
  }
}

