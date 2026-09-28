import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dailyNeeded,
  goalProgress,
  goalStatus,
  monthPace,
  matchZone,
  meetingsToday,
  nextMatricule,
  overdueFollowUps,
  periodRange,
  pickAgent,
  pickByLoad,
  pickRoundRobin,
  pipelineSummary,
  planDistribution,
  presence,
  rate,
  relativeDayLabel,
  seniorityLabel,
  shortAgentName,
  staleProspects,
  unansweredProposals,
  weekBuckets,
  weeklyActivityTrend,
  type Candidate,
  type PortfolioProspect,
} from "./agent-cockpit-logic";

const now = new Date(2026, 8, 28, 10, 0); // lundi 28 septembre 2026

const agents: Candidate[] = [
  { id: "j", name: "Jean Mukendi", activeProspects: 48, teamId: "A", zoneId: null },
  { id: "s", name: "Sarah Kabila", activeProspects: 31, teamId: "B", zoneId: null },
  { id: "d", name: "David Lunda", activeProspects: 57, teamId: "C", zoneId: null },
];

function prospect(patch: Partial<PortfolioProspect> = {}): PortfolioProspect {
  return {
    id: "p",
    ownerId: "j",
    createdAt: new Date(2026, 8, 1),
    firstContactAt: null,
    lastContactAt: null,
    lastActionAt: null,
    nextContactAt: null,
    convertedAt: null,
    status: { slug: "lead", isConverted: false, isLost: false },
    ...patch,
  };
}

test("round robin : tour de rôle stable, puis on revient au premier", () => {
  // Ordre alphabétique : David → Jean → Sarah
  assert.equal(pickRoundRobin(agents, null)?.id, "d");
  assert.equal(pickRoundRobin(agents, "d")?.id, "j");
  assert.equal(pickRoundRobin(agents, "j")?.id, "s");
  assert.equal(pickRoundRobin(agents, "s")?.id, "d");
});

test("selon la charge : l’agent le moins chargé", () => {
  assert.equal(pickByLoad(agents)?.id, "s");
});

test("selon la zone : la zone la plus précise l’emporte, puis la charge dans l’équipe", () => {
  const zones = [
    { id: "z1", name: "Kinshasa", teamId: "C", matchTerms: "Kinshasa" },
    { id: "z2", name: "Gombe", teamId: "A", matchTerms: "Kinshasa/Gombe, Gombe" },
    { id: "z3", name: "Lubumbashi", teamId: "C", matchTerms: "Lubumbashi" },
  ];
  assert.equal(matchZone(zones, { city: "Kinshasa", address: "Av. du Commerce, Gombe" })?.id, "z2");
  assert.equal(matchZone(zones, { city: "Kinshasa", address: "Limete" })?.id, "z1");
  assert.equal(matchZone(zones, { city: "Goma" }), null);
  assert.equal(pickAgent("ZONE", agents, { zones, prospect: { city: "Lubumbashi" } })?.id, "d");
  // Zone inconnue : repli sur la charge
  assert.equal(pickAgent("ZONE", agents, { zones, prospect: { city: "Goma" } })?.id, "s");
  assert.equal(pickAgent("MANUAL", agents, {}), null);
});

test("une distribution par lot reste équilibrée", () => {
  const even = agents.map((agent) => ({ ...agent, activeProspects: 0 }));
  const batch = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}` }));
  const { plan, lastAssignedId } = planDistribution("LOAD", even, batch);
  const counts = plan.reduce<Record<string, number>>((acc, item) => {
    acc[item.agentId] = (acc[item.agentId] ?? 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(counts, { d: 2, j: 2, s: 2 });
  assert.ok(lastAssignedId);
  const rr = planDistribution("ROUND_ROBIN", agents, batch.slice(0, 4), { lastAssignedId: "j" });
  assert.deepEqual(rr.plan.map((item) => item.agentId), ["s", "d", "j", "s"]);
});

test("alertes : relances en retard, prospects sans activité, propositions sans réponse, RDV du jour", () => {
  const tasks = [
    { id: "t1", ownerId: "j", type: "FOLLOW_UP" as const, status: "TODO", dueAt: new Date(2026, 8, 25) },
    { id: "t2", ownerId: "j", type: "CALL" as const, status: "DONE", dueAt: new Date(2026, 8, 20) },
    { id: "t3", ownerId: "j", type: "MEETING" as const, status: "TODO", dueAt: new Date(2026, 8, 28, 15) },
    { id: "t4", ownerId: "j", type: "MEETING" as const, status: "TODO", dueAt: new Date(2026, 8, 30, 9) },
  ];
  const prospects = [
    prospect({ id: "a", nextContactAt: new Date(2026, 8, 26) }),
    prospect({ id: "b", lastActionAt: new Date(2026, 8, 27) }),
    prospect({ id: "c", nextContactAt: new Date(2026, 8, 20), status: { slug: "finalise", isConverted: true, isLost: false } }),
  ];
  assert.equal(overdueFollowUps(tasks, prospects, now).count, 2);
  assert.deepEqual(meetingsToday(tasks, now).map((task) => task.id), ["t3"]);
  assert.deepEqual(staleProspects(prospects, now).map((item) => item.id), ["a"]);
  const opps = [
    { id: "o1", stageName: "Proposition envoyée", status: "OPEN", updatedAt: new Date(2026, 8, 10) },
    { id: "o2", stageName: "Proposition envoyée", status: "OPEN", updatedAt: new Date(2026, 8, 26) },
    { id: "o3", stageName: "Négociation", status: "OPEN", updatedAt: new Date(2026, 8, 1) },
  ];
  assert.deepEqual(unansweredProposals(opps, now).map((item) => item.id), ["o1"]);
});

test("objectifs et ratios", () => {
  assert.deepEqual(goalProgress(7, 10), { achieved: 7, target: 10, pct: 70 });
  assert.equal(goalProgress(3, 0).pct, null);
  assert.equal(rate(1, 3), 33);
  assert.equal(rate(1, 0), null);
});

test("périodes, présence et libellés", () => {
  assert.equal(periodRange("month", now).from.getDate(), 1);
  assert.equal(periodRange("quarter", now).from.getMonth(), 6);
  assert.equal(presence(new Date(now.getTime() - 5 * 60_000), now), "online");
  assert.equal(presence(new Date(now.getTime() - 3 * 3_600_000), now), "recent");
  assert.equal(presence(new Date(2026, 8, 20), now), null);
  assert.equal(relativeDayLabel(new Date(2026, 8, 28, 8), now), "Aujourd’hui");
  assert.equal(relativeDayLabel(new Date(2026, 8, 27, 18), now), "Hier");
  assert.equal(shortAgentName("Jean MUKENDI"), "Jean M.");
  assert.equal(nextMatricule(["AG-0003", null, "X-9", "AG-0010"]), "AG-0011");
  const weeks = weekBuckets([new Date(2026, 8, 28), new Date(2026, 8, 29), new Date(2026, 8, 21)], now, 2);
  assert.deepEqual(weeks.map((point) => point.value), [1, 2]);
});

test("tendance hebdomadaire par famille d’activité", () => {
  const trend = weeklyActivityTrend(
    [
      { occurredAt: new Date(2026, 8, 28, 9), type: "CALL" },
      { occurredAt: new Date(2026, 8, 29, 9), type: "WHATSAPP" },
      { occurredAt: new Date(2026, 8, 22, 9), type: "PROPOSAL" },
      { occurredAt: new Date(2026, 8, 23, 9), type: "NOTE" },
      { occurredAt: new Date(2026, 5, 1, 9), type: "CALL" },
    ],
    now,
    2,
  );
  assert.equal(trend.length, 2);
  assert.deepEqual(trend[1].values, { calls: 1, emails: 1, meetings: 0, proposals: 0, other: 0 });
  assert.deepEqual(trend[0].values, { calls: 0, emails: 0, meetings: 0, proposals: 1, other: 1 });
  assert.match(trend[1].range, /28\/09/);
});

test("rythme mensuel des objectifs", () => {
  const pace = monthPace(now); // 28 septembre (30 jours)
  assert.deepEqual([pace.day, pace.daysInMonth, pace.remainingDays], [28, 30, 2]);
  assert.equal(goalStatus(5, 0, 0.5), "none");
  assert.equal(goalStatus(10, 10, 0.5), "done");
  assert.equal(goalStatus(5, 10, 0.5), "on-track");
  assert.equal(goalStatus(4, 10, 0.6), "at-risk");
  assert.equal(goalStatus(1, 10, 0.6), "behind");
  assert.equal(dailyNeeded(4, 10, 2), 2);
  assert.equal(dailyNeeded(12, 10, 2), 0);
});

test("ancienneté lisible", () => {
  assert.equal(seniorityLabel(null, now), null);
  assert.equal(seniorityLabel(new Date(Date.UTC(2024, 5, 1)), now), "2 ans et 3 mois");
  assert.equal(seniorityLabel(new Date(Date.UTC(2025, 8, 28)), now), "1 an");
  assert.equal(seniorityLabel(new Date(Date.UTC(2026, 8, 10)), now), "Moins d’un mois");
  assert.equal(seniorityLabel(new Date(Date.UTC(2026, 10, 1)), now), "Arrivée prochaine");
});

test("synthèse du pipeline : pondération et taux de réussite", () => {
  const summary = pipelineSummary([
    { isWon: false, isLost: false, probability: 10, count: 2, value: 1000 },
    { isWon: false, isLost: false, probability: 80, count: 1, value: 5000 },
    { isWon: true, isLost: false, probability: 100, count: 3, value: 9000 },
    { isWon: false, isLost: true, probability: 0, count: 1, value: 700 },
  ]);
  assert.deepEqual(summary, {
    openCount: 3,
    openValue: 6000,
    weightedValue: 4100,
    wonCount: 3,
    wonValue: 9000,
    lostCount: 1,
    winRate: 75,
  });
});
