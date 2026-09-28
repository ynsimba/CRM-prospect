import Link from "next/link";
import { notFound } from "next/navigation";
import AgentDeleteForm from "@/components/AgentDeleteForm";
import AgentForm from "@/components/AgentForm";
import AgendaList from "@/components/agents/AgendaList";
import AgentsModule from "@/components/agents/AgentsModule";
import GoalForm from "@/components/agents/GoalForm";
import PerformancePanel from "@/components/agents/PerformancePanel";
import PipelineBoard from "@/components/agents/PipelineBoard";
import {
  AgentAvatar,
  formatCalendarDate,
  formatDateShort,
  KpiTile,
  PeriodForm,
  PresenceDot,
  ProgressBar,
  Timeline,
  pct,
} from "@/components/agents/ui";
import { setAgentStatusAction, updateAgentAction } from "@/app/actions/agents";
import {
  AGENT_STATUS_LABELS,
  AGENT_STATUS_PILL,
  parsePeriod,
  presence,
} from "@/lib/agent-cockpit-logic";
import {
  agendaFor,
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
import { formatFc } from "@/lib/money";
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
  searchParams: Promise<{ onglet?: string; periode?: string; statut?: string }>;
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
          <KpiTile label="Portefeuille" value={metrics.portfolio} icon="bi-briefcase" accent="blue" />
          <KpiTile label="À traiter" value={metrics.untreated} icon="bi-hourglass-split" accent="amber" alert={metrics.untreated > 0} />
          <KpiTile label="Relances en retard" value={metrics.overdue} icon="bi-alarm" accent="red" alert={metrics.overdue > 0} />
          <KpiTile label="RDV à venir" value={metrics.meetings} icon="bi-calendar-event" accent="violet" />
          <KpiTile label="Opportunités" value={metrics.openOpportunities} icon="bi-kanban" accent="teal" />
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
      {tab === "portefeuille" ? <PortfolioTab sheet={sheet} statusFilter={query.statut} /> : null}
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

async function ProfileTab({ scope, sheet }: { scope: Scope; sheet: Sheet }) {
  const { agent } = sheet;
  const [teams, zones, supervisors] = scope.canAdminister
    ? await Promise.all([listTeams(scope.session), listZones(scope), listSupervisors(scope)])
    : [[], [], []];
  return (
    <div className="agent-profile">
      <article className="dash-card agent-profile-facts">
        <h3>Informations RH</h3>
        <dl className="fact-list">
          <dt>Nom complet</dt>
          <dd>
            {agent.civility ? `${agent.civility} ` : ""}
            {agent.name}
          </dd>
          <dt>Matricule</dt>
          <dd>{agent.matricule ?? "—"}</dd>
          <dt>Téléphone</dt>
          <dd>{agent.phone ? <a href={`tel:${agent.phone.replace(/\s/g, "")}`}>{agent.phone}</a> : "—"}</dd>
          <dt>E-mail professionnel</dt>
          <dd>
            <a href={`mailto:${agent.email}`}>{agent.email}</a>
          </dd>
          <dt>Fonction</dt>
          <dd>{agent.jobTitle ?? "—"}</dd>
          <dt>Date d’intégration</dt>
          <dd>{formatCalendarDate(agent.hiredAt)}</dd>
          <dt>Statut</dt>
          <dd>
            <span className={`status-pill ${AGENT_STATUS_PILL[agent.status]}`}>{AGENT_STATUS_LABELS[agent.status]}</span>
          </dd>
        </dl>
      </article>
      {scope.canAdminister ? (
        <>
          <article className="dash-card agent-profile-form">
            <h3>Modifier la fiche</h3>
            <AgentForm
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
              submitLabel="Enregistrer les modifications"
            />
          </article>
          <div className="agent-profile-side">
            <article className="dash-card">
              <h3>Accès</h3>
              <p className="card-sub">
                Suspendre ou désactiver coupe l’accès. Le portefeuille et l’historique sont conservés.
              </p>
              <div className="status-actions">
                {(["ACTIVE", "SUSPENDED", "INACTIVE"] as const)
                  .filter((status) => status !== agent.status)
                  .map((status) => (
                    <form key={status} action={setAgentStatusAction.bind(null, agent.id, status)}>
                      <button type="submit" className={status === "ACTIVE" ? "btn-download" : "btn-soft"}>
                        {status === "ACTIVE" ? "Réactiver" : status === "SUSPENDED" ? "Suspendre" : "Désactiver"}
                      </button>
                    </form>
                  ))}
              </div>
            </article>
            <article className="dash-card agent-danger">
              <h3>Supprimer</h3>
              <p className="card-sub">Possible seulement sans activité ni tâche. Sinon, désactive l’agent.</p>
              <AgentDeleteForm agentId={agent.id} agentName={agent.name} />
            </article>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PortfolioTab({ sheet, statusFilter }: { sheet: Sheet; statusFilter?: string }) {
  const all = portfolioRows(sheet);
  const statuses = [...new Set(all.map((row) => row.prospect.statusName))];
  const rows = statusFilter ? all.filter((row) => row.prospect.statusName === statusFilter) : all;
  return (
    <article className="dash-card">
      <div className="card-head-row">
        <h3>
          Portefeuille prospects <span className="muted-line">({rows.length})</span>
        </h3>
        <form method="get" className="cockpit-filters is-inline">
          <input type="hidden" name="onglet" value="portefeuille" />
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
                <th scope="col" className="num">Valeur</th>
                <th scope="col">Dernier contact</th>
                <th scope="col">Prochaine action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ prospect, value, nextAction }) => (
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
                  <td className="num">{value ? formatFc(value) : "—"}</td>
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
    <article className="dash-card">
      <h3>Pipeline personnel</h3>
      <p className="card-sub">Nouveau → À contacter → Contacté → Qualifié → RDV → Proposition → Négociation → Gagné / Perdu</p>
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
    <div className="row g-3">
      <div className="col-12 col-xl-7">
        <article className="dash-card h-100">
          <h3>Objectif / Réalisé / Progression — {monthLabel}</h3>
          <ul className="goal-progress-list">
            {progress.rows.map((row) => (
              <li key={row.key}>
                <span className="goal-progress-label">{row.label}</span>
                <span className="goal-progress-figures">
                  {row.key === "revenue" ? formatFc(row.achieved) : row.achieved} /{" "}
                  {row.target ? (row.key === "revenue" ? formatFc(row.target) : row.target) : "—"}
                  {row.pct !== null ? <strong> — {pct(row.pct)}</strong> : null}
                </span>
                <ProgressBar pct={row.pct} label={`${row.label} : ${row.pct ?? 0} %`} />
              </li>
            ))}
          </ul>
        </article>
      </div>
      <div className="col-12 col-xl-5">
        <article className="dash-card h-100">
          <h3>Définir les objectifs de {monthLabel}</h3>
          <GoalForm owner={{ userId: agentId }} year={progress.year} month={progress.month} targets={progress.targets} />
        </article>
      </div>
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
      <PerformancePanel perf={perf} goals={goals} />
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
