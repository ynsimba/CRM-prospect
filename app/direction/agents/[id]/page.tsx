import Link from "next/link";
import { notFound } from "next/navigation";
import AgentDeleteForm from "@/components/AgentDeleteForm";
import AgentEditModal from "@/components/AgentEditModal";
import AgendaList from "@/components/agents/AgendaList";
import AgentsModule from "@/components/agents/AgentsModule";
import GoalForm from "@/components/agents/GoalForm";
import GoalsBoard from "@/components/agents/GoalsBoard";
import PerformanceDashboard from "@/components/agents/PerformanceDashboard";
import PipelineBoard from "@/components/agents/PipelineBoard";
import {
  AgentAvatar,
  formatDateShort,
  KpiTile,
  PeriodForm,
  PresenceDot,
  Timeline,
} from "@/components/agents/ui";
import { setAgentStatusAction, updateAgentAction } from "@/app/actions/agents";
import {
  AGENT_STATUS_LABELS,
  AGENT_STATUS_PILL,
  isUntreated,
  parsePeriod,
  presence,
} from "@/lib/agent-cockpit-logic";
import {
  agendaFor,
  activityTrendFor,
  agentPipeline,
  getAgentSheet,
  goalProgressFor,
  listSupervisors,
  listZones,
  performanceFor,
  portfolioRows,
  requireAgentScope,
  timeline,
} from "@/lib/agents";
import { ROLE_LABELS } from "@/lib/roles";
import { listTeams } from "@/lib/team";

const TABS = [
  { key: "profil", label: "Profil" },
  { key: "portefeuille", label: "Portefeuille" },
  { key: "pipeline", label: "Pipeline" },
  { key: "activites", label: "Activités" },
  { key: "agenda", label: "Agenda" },
  { key: "objectifs", label: "Objectifs" },
  { key: "performance", label: "Performance" },
  { key: "historique", label: "Historique" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const PRIORITY_LABELS: Record<string, string> = { LOW: "Basse", NORMAL: "Normale", HIGH: "Haute", URGENT: "Urgente" };

export default async function AgentSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onglet?: string; periode?: string; statut?: string; vue?: string }>;
}) {
  const scope = await requireAgentScope();
  const { id } = await params;
  const query = await searchParams;
  const tab: TabKey = TABS.some((item) => item.key === query.onglet) ? (query.onglet as TabKey) : "profil";
  const period = parsePeriod(query.periode);
  const sheet = await getAgentSheet(scope, id, period);
  if (!sheet) notFound();
  const { agent, metrics } = sheet;
  const now = new Date();

  return (
    <AgentsModule
      scope={scope}
      active="agents"
      title={agent.name}
      breadcrumb={
        <nav className="query-crumb" aria-label="Fil d’Ariane">
          <Link href="/direction/agents/liste">Agents</Link>
          <i className="bi bi-chevron-right" aria-hidden />
          <strong>{agent.name}</strong>
        </nav>
      }
      subtitle={
        <>
          {agent.jobTitle ?? ROLE_LABELS[agent.role]} · {agent.team?.name ?? "Sans équipe"}
          {agent.zone ? ` · ${agent.zone.name}` : ""} ·{" "}
          <span className={`status-pill ${AGENT_STATUS_PILL[agent.status]}`}>{AGENT_STATUS_LABELS[agent.status]}</span>
        </>
      }
      actions={
        <>
          <Link href={`/direction/agents/affectations/affecter?agent=${agent.id}`} className="btn-download">
            <i className="bi bi-person-plus" aria-hidden /> Affecter des prospects
          </Link>
          <Link href={`/direction/agents/affectations/reaffecter?de=${agent.id}`} className="btn-soft">
            <i className="bi bi-arrow-left-right" aria-hidden /> Réaffecter
          </Link>
        </>
      }
    >
      <div className="agent-hero">
        <span className="agent-avatar-wrap">
          <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} size={64} />
          <PresenceDot value={presence(agent.lastSeenAt, now)} />
        </span>
        <div className="kpi-grid is-compact">
          <KpiTile label="Portefeuille" value={metrics.portfolio} icon="bi-briefcase" accent="blue" href={`/direction/agents/${agent.id}?onglet=portefeuille`} />
          <KpiTile label="À traiter" value={metrics.untreated} icon="bi-hourglass-split" accent="amber" alert={metrics.untreated > 0} href={`/direction/agents/${agent.id}?onglet=portefeuille&vue=a-traiter`} />
          <KpiTile label="Relances en retard" value={metrics.overdue} icon="bi-alarm" accent="red" alert={metrics.overdue > 0} href={`/direction/agents/${agent.id}?onglet=portefeuille&vue=relances`} />
          <KpiTile label="RDV à venir" value={metrics.meetings} icon="bi-calendar-event" accent="violet" href={`/direction/agents/${agent.id}?onglet=agenda`} />
          <KpiTile label="Opportunités" value={metrics.openOpportunities} icon="bi-kanban" accent="teal" href={`/direction/agents/${agent.id}?onglet=pipeline`} />
        </div>
      </div>

      <nav className="cockpit-tabs" aria-label="Sections de la fiche">
        {TABS.map((item) => (
          <Link
            key={item.key}
            href={`/direction/agents/${agent.id}?onglet=${item.key}${query.periode ? `&periode=${period}` : ""}`}
            className={`cockpit-tab ${tab === item.key ? "active" : ""}`}
            aria-current={tab === item.key ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "profil" ? <ProfileTab scope={scope} sheet={sheet} /> : null}
      {tab === "portefeuille" ? <PortfolioTab sheet={sheet} statusFilter={query.statut} view={query.vue} /> : null}
      {tab === "pipeline" ? <PipelineTab scope={scope} agentId={agent.id} /> : null}
      {tab === "activites" ? <ActivityTab scope={scope} agentId={agent.id} /> : null}
      {tab === "agenda" ? <AgendaTab scope={scope} agentId={agent.id} /> : null}
      {tab === "objectifs" ? <GoalsTab scope={scope} agentId={agent.id} /> : null}
      {tab === "performance" ? <PerformanceTab scope={scope} sheet={sheet} period={period} /> : null}
      {tab === "historique" ? <HistoryTab scope={scope} agentId={agent.id} /> : null}
    </AgentsModule>
  );
}

type Scope = Awaited<ReturnType<typeof requireAgentScope>>;
type Sheet = NonNullable<Awaited<ReturnType<typeof getAgentSheet>>>;

const STATUS_CHOICES = [
  { status: "ACTIVE", label: "Actif", help: "Accès complet à son espace.", icon: "bi-check-circle", action: "Réactiver" },
  { status: "SUSPENDED", label: "Suspendu", help: "Accès coupé temporairement.", icon: "bi-pause-circle", action: "Suspendre" },
  { status: "INACTIVE", label: "Inactif", help: "Compte désactivé, historique conservé.", icon: "bi-x-circle", action: "Désactiver" },
] as const;

async function ProfileTab({ scope, sheet }: { scope: Scope; sheet: Sheet }) {
  const { agent } = sheet;
  const [teams, zones, supervisors] = scope.canAdminister
    ? await Promise.all([listTeams(scope.session), listZones(scope), listSupervisors(scope)])
    : [[], [], []];
  const online = presence(agent.lastSeenAt);

  return (
    <div className={`profile-module ${scope.canAdminister ? "" : "is-readonly"}`}>
      <aside className="profile-aside">
        <article className="profile-card">
          {scope.canAdminister ? (
            <AgentEditModal
              action={updateAgentAction.bind(null, agent.id)}
              teams={teams.map((team) => ({ id: team.id as string, name: team.name as string }))}
              zones={zones}
              supervisors={supervisors.filter((item) => item.id !== agent.id)}
              agent={{
                name: agent.name,
                email: agent.email,
                phone: agent.phone,
                civility: agent.civility,
                teamId: agent.teamId,
                zoneId: agent.zoneId,
                supervisorId: agent.supervisorId,
                matricule: agent.matricule,
                jobTitle: agent.jobTitle,
                hiredAt: agent.hiredAt ? agent.hiredAt.toISOString().slice(0, 10) : null,
                status: agent.status,
                role: agent.role === "TEAM_LEAD" ? "TEAM_LEAD" : "SALES",
                photoUrl: agent.photoUrl,
              }}
            />
          ) : null}
          <div className="profile-cover" aria-hidden />
          <div className="profile-identity">
            <span className="profile-avatar agent-avatar-wrap">
              <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} size={92} />
              <PresenceDot value={online} />
            </span>
            <h3 className="profile-name">
              {agent.civility ? <span className="profile-civility">{agent.civility} </span> : null}
              {agent.name}
            </h3>
            <p className="profile-role">{agent.jobTitle ?? ROLE_LABELS[agent.role]}</p>
            <div className="profile-badges">
              <span className={`status-pill ${AGENT_STATUS_PILL[agent.status]}`}>{AGENT_STATUS_LABELS[agent.status]}</span>
              <span className="profile-chip">
                <i className="bi bi-shield-check" aria-hidden /> {ROLE_LABELS[agent.role]}
              </span>
              {agent.team ? (
                <span className="profile-chip">
                  <i className="bi bi-people" aria-hidden /> {agent.team.name}
                </span>
              ) : null}
            </div>
            <div className="profile-actions">
              {agent.phone ? (
                <a className="profile-action" href={`tel:${agent.phone.replace(/\s/g, "")}`}>
                  <i className="bi bi-telephone" aria-hidden /> Appeler
                </a>
              ) : (
                <span className="profile-action is-disabled" aria-disabled="true">
                  <i className="bi bi-telephone" aria-hidden /> Pas de numéro
                </span>
              )}
              <a className="profile-action" href={`mailto:${agent.email}`}>
                <i className="bi bi-envelope" aria-hidden /> E-mail
              </a>
            </div>
          </div>
        </article>
      </aside>

      {scope.canAdminister ? (
        <div className="profile-main">
          <div className="profile-admin-row">
            <article className="dash-card profile-access">
              <h3>
                <i className="bi bi-key" aria-hidden /> Accès au compte
              </h3>
              <p className="card-sub">Le portefeuille et l’historique sont toujours conservés.</p>
              <div className="status-choices">
                {STATUS_CHOICES.map((choice) =>
                  choice.status === agent.status ? (
                    <div key={choice.status} className={`status-choice is-current is-${choice.status.toLowerCase()}`} aria-current="true">
                      <i className={`bi ${choice.icon}`} aria-hidden />
                      <span>
                        <strong>{choice.label}</strong>
                        <small>{choice.help}</small>
                      </span>
                      <span className="status-choice-tag">Actuel</span>
                    </div>
                  ) : (
                    <form key={choice.status} action={setAgentStatusAction.bind(null, agent.id, choice.status)}>
                      <button type="submit" className={`status-choice is-${choice.status.toLowerCase()}`}>
                        <i className={`bi ${choice.icon}`} aria-hidden />
                        <span>
                          <strong>{choice.action}</strong>
                          <small>{choice.help}</small>
                        </span>
                        <i className="bi bi-chevron-right status-choice-go" aria-hidden />
                      </button>
                    </form>
                  ),
                )}
              </div>
            </article>

            <article className="dash-card profile-danger">
              <h3>
                <i className="bi bi-exclamation-octagon" aria-hidden /> Zone de suppression
              </h3>
              <p className="card-sub">
                Suppression définitive, possible seulement si l’agent n’a ni activité ni tâche. Sinon, désactive-le.
              </p>
              <AgentDeleteForm agentId={agent.id} agentName={agent.name} />
            </article>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PortfolioTab({ sheet, statusFilter, view }: { sheet: Sheet; statusFilter?: string; view?: string }) {
  const all = portfolioRows(sheet);
  const scoped =
    view === "a-traiter"
      ? all.filter((row) => isUntreated(row.prospect))
      : view === "relances"
        ? all.filter((row) => row.nextAction?.overdue)
        : all;
  const heading = view === "a-traiter" ? "Prospects à traiter" : view === "relances" ? "Relances en retard" : "Portefeuille prospects";
  const statuses = [...new Set(scoped.map((row) => row.prospect.statusName))];
  const rows = statusFilter ? scoped.filter((row) => row.prospect.statusName === statusFilter) : scoped;
  return (
    <article className="dash-card">
      <div className="card-head-row">
        <h3>
          {heading} <span className="muted-line">({rows.length})</span>
        </h3>
        <form method="get" className="cockpit-filters is-inline">
          <input type="hidden" name="onglet" value="portefeuille" />
          {view === "a-traiter" || view === "relances" ? <input type="hidden" name="vue" value={view} /> : null}
          <label className="cockpit-filter">
            <span className="visually-hidden">Statut</span>
            <select name="statut" defaultValue={statusFilter ?? ""}>
              <option value="">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-soft">
            Filtrer
          </button>
        </form>
      </div>
      {rows.length === 0 ? (
        <p className="empty-copy">Aucun prospect dans ce portefeuille.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Prospect</th>
                <th scope="col">Entreprise</th>
                <th scope="col">Statut</th>
                <th scope="col">Priorité</th>
                <th scope="col">Dernier contact</th>
                <th scope="col">Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ prospect, nextAction }) => (
                <tr key={prospect.id}>
                  <td>
                    <Link href={`/prospects/${prospect.id}`} className="agent-name">
                      {prospect.firstName} {prospect.lastName !== "—" ? prospect.lastName : ""}
                    </Link>
                    {prospect.displayCode ? <span className="muted-line"> #{prospect.displayCode}</span> : null}
                  </td>
                  <td>{prospect.company?.name ?? "—"}</td>
                  <td>
                    <span className={`status-pill ${prospect.status.slug}`}>{prospect.statusName}</span>
                  </td>
                  <td>{PRIORITY_LABELS[prospect.priority] ?? prospect.priority}</td>
                  <td>{formatDateShort(prospect.lastContactAt)}</td>
                  <td className={nextAction?.overdue ? "is-danger" : undefined}>
                    {nextAction ? `${nextAction.label}${nextAction.date ? ` ${formatDateShort(nextAction.date)}` : ""}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

async function PipelineTab({ scope, agentId }: { scope: Scope; agentId: string }) {
  const board = await agentPipeline(scope, [agentId]);
  return (
    <article className="dash-card pipe-card-shell">
      <header className="pipe-head">
        <span className="pipe-head-icon" aria-hidden>
          <i className="bi bi-kanban" />
        </span>
        <div>
          <h3>Pipeline personnel</h3>
          <p className="card-sub">Où se trouvent les affaires de l’agent, de la première prise de contact à la signature.</p>
        </div>
      </header>
      <PipelineBoard columns={board.columns} />
    </article>
  );
}

async function ActivityTab({ scope, agentId }: { scope: Scope; agentId: string }) {
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const events = await timeline(scope, [agentId], { from, take: 150 });
  return (
    <article className="dash-card">
      <h3>Activités commerciales — 30 derniers jours</h3>
      <p className="card-sub">Construit automatiquement à partir des actions de l’agent : aucun rapport à rédiger.</p>
      <Timeline events={events} empty="Aucune activité enregistrée sur les 30 derniers jours." />
    </article>
  );
}

async function AgendaTab({ scope, agentId }: { scope: Scope; agentId: string }) {
  const items = await agendaFor(scope, [agentId], 14);
  return (
    <article className="dash-card">
      <h3>Agenda — 14 prochains jours</h3>
      <AgendaList items={items} showAgent={false} empty="Rien de programmé : aucun appel, relance ou rendez-vous à venir." />
    </article>
  );
}

async function GoalsTab({ scope, agentId }: { scope: Scope; agentId: string }) {
  const progress = await goalProgressFor(scope, agentId);
  const monthLabel = new Date(progress.year, progress.month - 1, 1).toLocaleDateString("fr-CD", { month: "long", year: "numeric" });
  return (
    <div className="goals-module">
      <GoalsBoard rows={progress.rows} monthLabel={monthLabel} />
      <article className="dash-card goal-editor" id="definir-objectifs">
        <header className="goal-editor-head">
          <span className="goal-editor-icon" aria-hidden>
            <i className="bi bi-bullseye" />
          </span>
          <div>
            <h3>Définir les objectifs de {monthLabel}</h3>
            <p className="card-sub">Laisse à 0 un indicateur que tu ne veux pas suivre ce mois-ci.</p>
          </div>
        </header>
        <GoalForm owner={{ userId: agentId }} year={progress.year} month={progress.month} targets={progress.targets} />
      </article>
    </div>
  );
}

async function PerformanceTab({ scope, sheet, period }: { scope: Scope; sheet: Sheet; period: ReturnType<typeof parsePeriod> }) {
  const perf = performanceFor(sheet.agent.id, sheet.data, sheet.range);
  const goals = period === "month" ? (await goalProgressFor(scope, sheet.agent.id)).rows : undefined;
  return (
    <>
      <div className="card-head-row cockpit-section">
        <p className="card-sub">
          {sheet.range.label}
          {goals ? " · comparé aux objectifs du mois" : " · les objectifs sont mensuels : choisis « Ce mois » pour les comparer"}
        </p>
        <PeriodForm period={period} hidden={{ onglet: "performance" }} />
      </div>
      <PerformanceDashboard
        data={{ activity: perf.activity, results: { qualified: perf.results.qualified, opportunities: perf.results.opportunities }, ratios: perf.ratios }}
        goals={goals}
        trend={activityTrendFor(sheet.agent.id, sheet.data)}
      />
    </>
  );
}

async function HistoryTab({ scope, agentId }: { scope: Scope; agentId: string }) {
  const [portfolioEvents, ownEvents] = await Promise.all([
    timeline(scope, [agentId], { take: 200, portfolioWide: true }),
    timeline(scope, [agentId], { take: 200 }),
  ]);
  const merged = [...new Map([...portfolioEvents, ...ownEvents].map((event) => [event.id, event])).values()].sort(
    (a, b) => b.at.getTime() - a.at.getTime(),
  );
  return (
    <article className="dash-card">
      <h3>Historique et audit</h3>
      <p className="card-sub">
        <i className="bi bi-lock" aria-hidden /> Journal en lecture seule : affectations, changements de statut, activités et
        opportunités. Personne ne peut le modifier depuis l’application.
      </p>
      <Timeline events={merged.slice(0, 200)} empty="Aucun événement enregistré." />
    </article>
  );
}
