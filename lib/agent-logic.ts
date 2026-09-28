/** Stored display name follows the house style: « Neisse ENGANI ». */
export function formatAgentName(firstName: string, lastName: string) {
  const first = firstName.trim().replace(/\s+/g, " ");
  const last = lastName.trim().replace(/\s+/g, " ").toLocaleUpperCase("fr");
  return [first, last].filter(Boolean).join(" ");
}

/** Inverse of formatAgentName for the edit form: first word is the first name, the rest the last name. */
export function splitAgentName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export type AgentHistory = { activities: number; tasks: number };

/** Activities and tasks keep a hard FK on the agent, so an agent with history can only be deactivated. */
export function agentDeletionBlocker(history: AgentHistory) {
  if (history.activities === 0 && history.tasks === 0) return null;
  const parts = [
    history.activities ? `${history.activities} activité${history.activities > 1 ? "s" : ""}` : "",
    history.tasks ? `${history.tasks} tâche${history.tasks > 1 ? "s" : ""}` : "",
  ].filter(Boolean);
  return `Cet agent a un historique (${parts.join(", ")}). Désactive-le plutôt : son accès est coupé et l’historique est conservé.`;
}
