import AgentsModule from "@/components/agents/AgentsModule";
import AssignForm from "@/components/agents/AssignForm";
import { agentLoadOptions, listAssignableProspects, loadAgents, requireAgentScope, toAssignable } from "@/lib/agents";

export default async function ReassignPage({ searchParams }: { searchParams: Promise<{ de?: string; vers?: string }> }) {
  const scope = await requireAgentScope();
  const params = await searchParams;
  const [allAgents, targets] = await Promise.all([loadAgents(scope), agentLoadOptions(scope)]);
  const source = allAgents.find((agent) => agent.id === params.de);
  const rows = source ? await listAssignableProspects(scope, { ownerId: source.id, take: 500 }) : [];
  return (
    <AgentsModule
      scope={scope}
      active="reaffecter"
      title="Réaffecter un portefeuille"
      subtitle="Transfère des prospects d’un agent à un autre. Le prospect garde tout son historique : activités, tâches, statuts."
    >
      <article className="dash-card cockpit-section">
        <form method="get" className="cockpit-filters">
          <label className="cockpit-filter grow">
            <span>Agent actuel</span>
            <select name="de" defaultValue={source?.id ?? ""} required>
              <option value="">Choisir l’agent dont on transfère le portefeuille…</option>
              {allAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                  {agent.status !== "ACTIVE" ? " (absent / inactif)" : ""}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-download">
            Afficher son portefeuille
          </button>
        </form>
      </article>
      {source ? (
        <article className="dash-card">
          <h3>
            Portefeuille de {source.name} <span className="muted-line">({rows.length})</span>
          </h3>
          <AssignForm
            prospects={toAssignable(rows)}
            agents={targets}
            reassign
            excludeAgentId={source.id}
            defaultAgentId={params.vers ?? ""}
          />
        </article>
      ) : (
        <p className="empty-copy">Choisis d’abord l’agent dont tu veux transférer les prospects.</p>
      )}
    </AgentsModule>
  );
}
