import AgentsModule from "@/components/agents/AgentsModule";
import AssignForm from "@/components/agents/AssignForm";
import { ASSIGNMENT_MODE_HELP, ASSIGNMENT_MODE_LABELS } from "@/lib/agent-cockpit-logic";
import { agentLoadOptions, getAssignmentRule, listAssignableProspects, requireAgentScope, toAssignable } from "@/lib/agents";

export default async function UnassignedProspectsPage() {
  const scope = await requireAgentScope();
  const [rows, agents, rule] = await Promise.all([
    listAssignableProspects(scope, { ownerId: "unassigned" }),
    agentLoadOptions(scope),
    getAssignmentRule(scope),
  ]);
  return (
    <AgentsModule
      scope={scope}
      active="non-affectes"
      title="Prospects non affectés"
      subtitle={`${rows.length} prospect${rows.length > 1 ? "s" : ""} sans agent commercial`}
    >
      <div className="info-banner cockpit-section">
        <i className="bi bi-shuffle" aria-hidden />
        <p>
          Règle actuelle : <strong>{ASSIGNMENT_MODE_LABELS[rule.mode]}</strong> — {ASSIGNMENT_MODE_HELP[rule.mode]}
        </p>
      </div>
      <article className="dash-card">
        <AssignForm
          prospects={toAssignable(rows)}
          agents={agents}
          allowAuto
          defaultAgentId={rule.mode === "MANUAL" ? "" : "auto"}
          defaultMode={rule.mode}
        />
      </article>
    </AgentsModule>
  );
}
