import Link from "next/link";
import AgentsModule from "@/components/agents/AgentsModule";
import AgentCreateModal from "@/components/AgentCreateModal";
import { AgentAvatar, PeriodForm, PresenceDot } from "@/components/agents/ui";
import {
  AGENT_STATUS_LABELS,
  AGENT_STATUS_PILL,
  parsePeriod,
  relativeDayLabel,
  shortAgentName,
} from "@/lib/agent-cockpit-logic";
import { listAgentsWithMetrics, listSupervisors, listZones, requireAgentScope } from "@/lib/agents";
import type { AgentStatus } from "@/lib/enums";
import { ROLE_LABELS } from "@/lib/roles";
import { listTeams } from "@/lib/team";

type Search = { q?: string; statut?: string; equipe?: string; zone?: string; periode?: string };

const STATUS_KEYS = ["ACTIVE", "SUSPENDED", "INACTIVE"] as const;

export default async function AgentsListPage({ searchParams }: { searchParams: Promise<Search> }) {
  const scope = await requireAgentScope();
  const params = await searchParams;
  const period = parsePeriod(params.periode);
  const status = STATUS_KEYS.includes(params.statut as AgentStatus) ? (params.statut as AgentStatus) : "";
  const [{ rows, range }, teams, zones, supervisors] = await Promise.all([
    listAgentsWithMetrics(scope, { q: params.q, status, teamId: params.equipe, zoneId: params.zone, period }),
    listTeams(scope.session),
    listZones(scope),
    scope.canAdminister ? listSupervisors(scope) : Promise.resolve([]),
  ]);
  const teamOptions = teams.map((team) => ({ id: team.id as string, name: team.name as string }));
  const zoneOptions = zones.map((zone) => ({ id: zone.id, name: zone.name }));
  const active = status === "ACTIVE" ? "agents-actifs" : status === "INACTIVE" ? "agents-inactifs" : "agents";
  const heading = status === "ACTIVE" ? "Agents actifs" : status === "INACTIVE" ? "Agents inactifs" : "Tous les agents";

  return (
    <AgentsModule
      scope={scope}
      active={active}
      title={heading}
      subtitle={`${rows.length} agent${rows.length > 1 ? "s" : ""} · indicateurs : ${range.label.toLowerCase()}`}
      actions={
        scope.canAdminister ? (
          <AgentCreateModal teams={teamOptions} zones={zoneOptions} supervisors={supervisors} />
        ) : null
      }
    >
      <article className="dash-card agents-board">
        <PeriodForm period={period} className="agents-filters">
          <label className="cockpit-filter grow">
            <span>Recherche</span>
            <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Nom, e-mail ou matricule" />
          </label>
          <label className="cockpit-filter">
            <span>Statut</span>
            <select name="statut" defaultValue={status}>
              <option value="">Tous</option>
              {STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {AGENT_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          {scope.isTeamLead ? null : (
            <label className="cockpit-filter">
              <span>Équipe</span>
              <select name="equipe" defaultValue={params.equipe ?? ""}>
                <option value="">Toutes</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="cockpit-filter">
            <span>Zone commerciale</span>
            <select name="zone" defaultValue={params.zone ?? ""}>
              <option value="">Toutes</option>
              {zoneOptions.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </label>
        </PeriodForm>
        {rows.length === 0 ? (
          <p className="empty-copy">Aucun agent ne correspond à ces critères.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table agents-table">
              <thead>
                <tr>
                  <th scope="col">Agent</th>
                  <th scope="col" className="num">Portefeuille</th>
                  <th scope="col" className="num">À traiter</th>
                  <th scope="col" className="num">Relances</th>
                  <th scope="col" className="num">RDV</th>
                  <th scope="col" className="num">Opportunités</th>
                  <th scope="col" className="num">Convertis</th>
                  <th scope="col">Dernière activité</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ agent, metrics, presence }) => (
                  <tr key={agent.id} className={agent.status === "ACTIVE" ? undefined : "is-inactive"}>
                    <td>
                      <Link href={`/direction/agents/${agent.id}`} className="agent-cell">
                        <span className="agent-avatar-wrap">
                          <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} />
                          <PresenceDot value={presence} />
                        </span>
                        <span>
                          <span className="agent-name">{shortAgentName(agent.name)}</span>
                          <span className="muted-line">
                            {agent.role === "TEAM_LEAD" ? `${ROLE_LABELS.TEAM_LEAD} · ` : ""}
                            {agent.team?.name ?? "Sans équipe"}
                            {agent.zone ? ` · ${agent.zone.name}` : ""}
                          </span>
                        </span>
                      </Link>
                      {agent.status !== "ACTIVE" ? (
                        <span className={`status-pill ${AGENT_STATUS_PILL[agent.status]}`}>{AGENT_STATUS_LABELS[agent.status]}</span>
                      ) : null}
                    </td>
                    <td className="num">{metrics.portfolio}</td>
                    <td className={`num ${metrics.untreated > 0 ? "is-warn" : ""}`}>{metrics.untreated}</td>
                    <td className={`num ${metrics.overdue > 0 ? "is-danger" : ""}`}>{metrics.overdue}</td>
                    <td className="num">{metrics.meetings}</td>
                    <td className="num">{metrics.openOpportunities}</td>
                    <td className="num">{metrics.conversions}</td>
                    <td>{relativeDayLabel(metrics.lastActivityAt)}</td>
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
