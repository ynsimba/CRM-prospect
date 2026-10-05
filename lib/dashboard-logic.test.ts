import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dormantWhere,
  isDormantProspect,
  agentPerformanceFromStatusCounts,
  allProspectsKpi,
  dashboardKpiDetailTitle,
  dashboardKpiHeading,
  dashboardProspectTableColumns,
  dormantProspectsKpi,
  followUpProspectsKpi,
  isCommentableDashboardKpi,
  isRelanceDashboardKpi,
  parseDashboardKpiId,
  prospectPerformancePoints,
  PROSPECT_PERFORMANCE_POINTS,
  RELANCE_TABLE_COLUMNS,
  TEAM_PROSPECT_TABLE_COLUMNS,
} from "./dashboard-logic";
import { welcomeDisplayName, welcomeMessage } from "./welcome";
import { last12MonthWinRates } from "./report-logic";

test("un prospect sans progression depuis 6 mois est dormant", () => {
  const now = new Date("2026-08-28T12:00:00");
  assert.equal(
    isDormantProspect(
      { lastContactAt: new Date("2026-01-01T12:00:00"), createdAt: new Date("2025-01-01T12:00:00") },
      now,
    ),
    true,
  );
  assert.equal(
    isDormantProspect(
      { lastContactAt: new Date("2026-08-10T12:00:00"), createdAt: new Date("2025-01-01T12:00:00") },
      now,
    ),
    false,
  );
  assert.equal(
    isDormantProspect(
      {
        lastContactAt: new Date("2026-01-01T12:00:00"),
        createdAt: new Date("2025-01-01T12:00:00"),
        isConverted: true,
      },
      now,
    ),
    false,
  );
});

test("filtre Prisma des dormants", () => {
  const where = dormantWhere(new Date("2026-08-28T12:00:00"));
  assert.equal(where.status.isConverted, false);
  assert.equal(where.OR.length, 4);
});

test("taux de réussite pipeline par mois", () => {
  const now = new Date(2026, 7, 28);
  const rates = last12MonthWinRates(
    [
      { date: new Date(2026, 7, 2), won: true },
      { date: new Date(2026, 7, 10), won: false },
      { date: new Date(2026, 6, 15), won: true },
    ],
    now,
  );
  assert.equal(rates.length, 12);
  assert.equal(rates[11].label, "Août");
  assert.equal(rates[11].value, 50);
  assert.equal(rates[10].label, "Juil");
  assert.equal(rates[10].value, 100);
  assert.equal(rates[9].value, 0);
});

test("mot de bienvenue selon le moment de la journée", () => {
  const name = "Neisse ENGANI";
  assert.equal(welcomeMessage(name, new Date("2026-09-02T03:00:00+01:00")), "Bonne nuit, Neisse");
  assert.equal(welcomeMessage(name, new Date("2026-09-02T08:30:00+01:00")), "Bonjour, Neisse");
  assert.equal(welcomeMessage(name, new Date("2026-09-02T14:00:00+01:00")), "Bon après-midi, Neisse");
  assert.equal(welcomeMessage(name, new Date("2026-09-02T19:15:00+01:00")), "Bonsoir, Neisse");
  assert.equal(welcomeMessage("  ", new Date("2026-09-02T08:00:00+01:00")), "Bonjour");
});

test("widget Tous les prospects pointe vers les prospects de l’utilisateur", () => {
  const kpi = allProspectsKpi(7);
  assert.equal(kpi.id, "mine");
  assert.equal(kpi.label, "Tous les prospects");
  assert.equal(kpi.hint, "Ensemble de mes prospects actifs");
  assert.equal(kpi.value, 7);
  assert.equal(kpi.href, "/prospects?mine=1");
  assert.equal(kpi.tone, "brand");
});

test("widget Direction compte tous les prospects des agents", () => {
  const kpi = allProspectsKpi(21, { scope: "all", href: "/direction/prospects" });
  assert.equal(kpi.id, "all");
  assert.equal(kpi.hint, "Ajoutés par les agents commerciaux");
  assert.equal(kpi.value, 21);
  assert.equal(kpi.href, "/direction/prospects");
});

test("widget Prospects dormants compte 2 mois d’inactivité", () => {
  const kpi = dormantProspectsKpi(4, "/prospects?mine=1");
  assert.equal(kpi.id, "dormant");
  assert.equal(kpi.label, "Prospects dormants");
  assert.equal(kpi.hint, "Prospect ayant 2 mois d’inactivité");
  assert.equal(kpi.value, 4);
  assert.equal(kpi.href, "/prospects?mine=1");
  assert.equal(kpi.tone, "orange");
});

test("widget A relancer compte les prospects à relancer", () => {
  const kpi = followUpProspectsKpi(1, "/prospects?mine=1");
  assert.equal(kpi.id, "relance");
  assert.equal(kpi.label, "A relancer");
  assert.equal(kpi.hint, "Prospect à relancer");
  assert.equal(kpi.value, 1);
  assert.equal(kpi.href, "/prospects?mine=1");
  assert.equal(kpi.tone, "navy");
  assert.equal(kpi.icon, "bi-exclamation-triangle-fill");
});

test("identifie le widget cliqué pour le panneau de détail", () => {
  assert.deepEqual(parseDashboardKpiId("mine"), { type: "mine" });
  assert.deepEqual(parseDashboardKpiId("all"), { type: "all" });
  assert.deepEqual(parseDashboardKpiId("dormant"), { type: "dormant" });
  assert.deepEqual(parseDashboardKpiId("relance"), { type: "relance" });
  assert.deepEqual(parseDashboardKpiId("status:sc_pipeline_1"), { type: "status", statusId: "sc_pipeline_1" });
  assert.equal(parseDashboardKpiId("status:"), null);
  assert.equal(parseDashboardKpiId("lead"), null);
});

test("le détail d’un widget privilégie le nom d’entreprise", () => {
  assert.equal(dashboardKpiDetailTitle("SafeCheck SARL", "Neisse", "ENGANI"), "SafeCheck SARL");
  assert.equal(dashboardKpiDetailTitle("  ", "Neisse", "ENGANI"), "Neisse ENGANI");
  assert.equal(dashboardKpiDetailTitle(null, "", ""), "Prospect");
});

test("le panneau A relancer affiche une table à 4 colonnes", () => {
  assert.equal(isRelanceDashboardKpi("relance"), true);
  assert.equal(isRelanceDashboardKpi("mine"), false);
  assert.equal(isCommentableDashboardKpi("all"), true);
  assert.equal(isCommentableDashboardKpi("relance"), true);
  assert.deepEqual([...RELANCE_TABLE_COLUMNS], ["Nom de l'entreprise", "Statut", "Action", "Date"]);
  assert.deepEqual([...dashboardProspectTableColumns(true)], [...TEAM_PROSPECT_TABLE_COLUMNS]);
});

test("le panneau affiche le titre sans l’emoji d’alerte", () => {
  assert.equal(dashboardKpiHeading("A relancer 🚨"), "A relancer");
  assert.equal(dashboardKpiHeading("Tous les prospects"), "Tous les prospects");
});

test("préfixe Mr / Mme uniquement dans le widget de bienvenue", () => {
  const date = new Date("2026-09-02T14:00:00+01:00");
  assert.equal(welcomeDisplayName("Neisse ENGANI", "Mme"), "Mme Neisse ENGANI");
  assert.equal(welcomeDisplayName("Françis BALUMENE", "Mr"), "Mr Françis BALUMENE");
  assert.equal(welcomeDisplayName("Françis BALUMENE", "Dr"), "Françis BALUMENE");
  assert.equal(
    welcomeMessage("Neisse ENGANI", date, undefined, "Mme"),
    "Bon après-midi, Mme Neisse",
  );
  assert.equal(
    welcomeMessage("Françis BALUMENE", date, undefined, "Mr"),
    "Bon après-midi, Mr Françis",
  );
});

test("points de performance par statut prospect", () => {
  assert.equal(prospectPerformancePoints("opportunite"), 5);
  assert.equal(prospectPerformancePoints("lead"), 15);
  assert.equal(prospectPerformancePoints("pipeline"), 30);
  assert.equal(prospectPerformancePoints("finalise"), 50);
  assert.equal(prospectPerformancePoints("rejete"), 0);
  assert.equal(prospectPerformancePoints("inconnu"), 0);
  assert.equal(
    PROSPECT_PERFORMANCE_POINTS.opportunite +
      PROSPECT_PERFORMANCE_POINTS.lead +
      PROSPECT_PERFORMANCE_POINTS.pipeline +
      PROSPECT_PERFORMANCE_POINTS.finalise,
    100,
  );
});

test("score agent = somme des points plafonnée à 100", () => {
  const empty = agentPerformanceFromStatusCounts([]);
  assert.equal(empty.percent, 0);
  assert.equal(empty.points, 0);

  const created = agentPerformanceFromStatusCounts([{ slug: "opportunite", count: 1 }]);
  assert.equal(created.percent, 5);
  assert.equal(created.byStage.opportunite, 1);

  const lead = agentPerformanceFromStatusCounts([{ slug: "lead", count: 1 }]);
  assert.equal(lead.percent, 15);

  const mix = agentPerformanceFromStatusCounts([
    { slug: "opportunite", count: 2 },
    { slug: "lead", count: 1 },
    { slug: "pipeline", count: 1 },
    { slug: "finalise", count: 1 },
    { slug: "rejete", count: 3 },
  ]);
  // 2*5 + 15 + 30 + 50 = 105 → plafonné à 100
  assert.equal(mix.points, 105);
  assert.equal(mix.percent, 100);
  assert.equal(mix.byStage.pipeline, 1);
  assert.equal(mix.byStage.finalise, 1);
});
