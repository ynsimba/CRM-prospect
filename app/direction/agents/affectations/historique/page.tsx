import Link from "next/link";
import AgentsModule from "@/components/agents/AgentsModule";
import { assignmentHistory, loadAgents, requireAgentScope } from "@/lib/agents";

const MODE_LABELS: Record<string, string> = {
  MANUAL: "Manuel",
  REASSIGN: "Réaffectation",
  ROUND_ROBIN: "Round Robin",
  LOAD: "Selon la charge",
  ZONE: "Selon la zone",
};

export default async function AssignmentHistoryPage({ searchParams }: { searchParams: Promise<{ agent?: string }> }) {
  const scope = await requireAgentScope();
  const params = await searchParams;
  const [agents, rows] = await Promise.all([
    loadAgents(scope),
    assignmentHistory(scope, { agentId: params.agent || undefined, take: 300 }),
  ]);
  return (
    <AgentsModule
      scope={scope}
      active="historique-affectations"
      title="Historique des affectations"
      subtitle="Qui a affecté quel prospect, à qui, quand, et qui en était responsable avant. Historique non modifiable."
    >
      <article className="dash-card cockpit-section">
        <form method="get" className="cockpit-filters">
          <label className="cockpit-filter grow">
            <span>Agent</span>
            <select name="agent" defaultValue={params.agent ?? ""}>
              <option value="">Tous les agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-download">
            Filtrer
          </button>
        </form>
      </article>
      <article className="dash-card">
        {rows.length === 0 ? (
          <p className="empty-copy">Aucune affectation enregistrée pour le moment.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date et heure</th>
                  <th scope="col">Prospect</th>
                  <th scope="col">Ancien responsable</th>
                  <th scope="col">Nouveau responsable</th>
                  <th scope="col">Effectué par</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Motif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.occurredAt.toLocaleString("fr-CD", { dateStyle: "short", timeStyle: "short" })}</td>
                    <td>
                      <Link href={`/prospects/${row.prospectId}`} className="agent-name">
                        {row.prospectCode ? `#${row.prospectCode} ` : ""}
                        {row.prospectLabel ?? "Prospect"}
                      </Link>
                    </td>
                    <td>{row.fromName ?? <span className="muted-line">—</span>}</td>
                    <td>{row.toName ?? <span className="muted-line">—</span>}</td>
                    <td>{row.actorName}</td>
                    <td>{MODE_LABELS[row.mode] ?? row.mode}</td>
                    <td>{row.reason ?? <span className="muted-line">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </AgentsModule>
  );
}
