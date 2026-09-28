import AgentsModule from "@/components/agents/AgentsModule";
import AssignForm from "@/components/agents/AssignForm";
import { agentLoadOptions, listAssignableProspects, requireAgentScope, toAssignable } from "@/lib/agents";

export default async function AssignPage({ searchParams }: { searchParams: Promise<{ agent?: string; q?: string }> }) {
  const scope = await requireAgentScope();
  const params = await searchParams;
  const [rows, agents] = await Promise.all([
    listAssignableProspects(scope, { ownerId: "unassigned", q: params.q }),
    agentLoadOptions(scope),
  ]);
  const target = agents.find((agent) => agent.id === params.agent);
  return (
    <AgentsModule
      scope={scope}
      active="affecter"
      title={target ? `Affecter des prospects à ${target.name}` : "Affecter des prospects"}
      subtitle="Sélectionne un ou plusieurs prospects puis l’agent qui les reçoit. Chaque affectation est tracée."
    >
      <article className="dash-card cockpit-section">
        <form method="get" className="cockpit-filters">
          {params.agent ? <input type="hidden" name="agent" value={params.agent} /> : null}
          <label className="cockpit-filter grow">
            <span>Rechercher parmi les prospects non affectés</span>
            <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Nom, entreprise, ville, code prospect" />
          </label>
          <button type="submit" className="btn-download">
            <i className="bi bi-search" aria-hidden /> Rechercher
          </button>
        </form>
      </article>
      <article className="dash-card">
        <AssignForm prospects={toAssignable(rows)} agents={agents} defaultAgentId={target?.id ?? ""} allowAuto />
      </article>
    </AgentsModule>
  );
}
