import assert from "node:assert/strict";
import { test } from "node:test";
import {
  goalProgress,
  matchZone,
  meetingsToday,
  nextMatricule,
  overdueFollowUps,
  periodRange,
  pickAgent,
  pickByLoad,
  pickRoundRobin,
  planDistribution,
  presence,
  rate,
  relativeDayLabel,
  shortAgentName,
  staleProspects,
  unansweredProposals,
  weekBuckets,
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
