"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { auditAs } from "@/lib/audit";
import { parseTargetInt } from "@/lib/goal-logic";
import { PERMISSIONS } from "@/lib/permissions";
import { assignUserTeam, createTeam, upsertGoal } from "@/lib/team";
import { readOptionalId } from "@/lib/crm";

export type TeamFormState = {
  error?: string;
  success?: string;
};

export async function createTeamAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const session = await requirePermission(PERMISSIONS.usersManage);
  try {
    const team = await createTeam(session, String(formData.get("name") ?? ""));
    await auditAs(session, {
      action: "team.create",
      entity: "Team",
      entityId: team.id,
      summary: `Équipe ${team.name}`,
    });
    revalidatePath("/equipe");
    return { success: `${team.name} a été créée.` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de créer l’équipe.";
    if (message.includes("Unique constraint")) {
      return { error: "Cette équipe existe déjà." };
    }
    return { error: message };
  }
}

export async function assignTeamAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const session = await requirePermission(PERMISSIONS.usersManage);
  try {
    const user = await assignUserTeam(
      session,
      String(formData.get("userId") ?? ""),
      readOptionalId(formData.get("teamId")) ?? null,
    );
    await auditAs(session, {
      action: "team.assign",
      entity: "User",
      entityId: user.id,
      summary: `Affectation d’équipe pour ${user.name}`,
    });
    revalidatePath("/equipe");
    revalidatePath("/parametres");
    return { success: `${user.name} a été affecté.` };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d’affecter.",
    };
  }
}

export async function saveGoalAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const session = await requirePermission(PERMISSIONS.usersManage);
  try {
    const year = Number(formData.get("year"));
    const month = Number(formData.get("month"));
    const goal = await upsertGoal(session, {
      userId: String(formData.get("userId") ?? ""),
      year,
      month,
      prospectsTarget: parseTargetInt(String(formData.get("prospectsTarget") ?? "0"), "Prospects"),
      meetingsTarget: parseTargetInt(String(formData.get("meetingsTarget") ?? "0"), "Rendez-vous"),
      opportunitiesTarget: parseTargetInt(String(formData.get("opportunitiesTarget") ?? "0"), "Opportunités"),
      revenueTarget: 0,
    });
    await auditAs(session, {
      action: "goal.upsert",
      entity: "Goal",
      entityId: goal.id,
      summary: `Objectif ${goal.month}/${goal.year}`,
    });
    revalidatePath("/equipe");
    return { success: "Objectif enregistré." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Impossible d’enregistrer l’objectif.",
    };
  }
}
