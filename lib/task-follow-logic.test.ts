import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agentTaskLoads,
  canDirectorCommentOnAssignedTask,
  filterFollowTasks,
  followTasksHref,
  relativeTimeLabel,
  summarizeTaskFollowUp,
} from "./task-follow-logic";

const now = new Date("2026-09-15T10:00:00");

test("le suivi direction compte les statuts et les retards", () => {
  const summary = summarizeTaskFollowUp(
    [
      { ownerId: "a", status: "TODO", dueAt: new Date("2026-09-10"), updatedAt: now },
      { ownerId: "a", status: "IN_PROGRESS", dueAt: new Date("2026-09-16"), updatedAt: now },
      { ownerId: "b", status: "DONE", dueAt: null, updatedAt: now },
      { ownerId: "b", status: "CANCELLED", dueAt: new Date("2026-09-01"), updatedAt: now },
    ],
    now,
  );
  assert.deepEqual(summary, { todo: 1, inProgress: 1, done: 1, cancelled: 1, overdue: 1, total: 4 });
});

test("la charge par commercial agrège les tâches ouvertes", () => {
  const loads = agentTaskLoads(
    [
      { id: "a", name: "Neisse", team: { name: "Terrain" } },
      { id: "b", name: "Marie", team: null },
    ],
    [
      { ownerId: "a", status: "TODO", dueAt: new Date("2026-09-10"), updatedAt: now },
      { ownerId: "a", status: "DONE", dueAt: null, updatedAt: now },
      { ownerId: "b", status: "IN_PROGRESS", dueAt: new Date("2026-09-20"), updatedAt: now },
    ],
  );
  assert.equal(loads[0].open, 1);
  assert.equal(loads[0].done, 1);
  assert.equal(loads[0].overdue, 1);
  assert.equal(loads[1].team, "Sans département");
  assert.equal(loads[1].open, 1);
});

test("l’étiquette temps réel reste lisible", () => {
  assert.equal(relativeTimeLabel(now, now), "À l’instant");
  assert.equal(relativeTimeLabel(new Date("2026-09-15T09:50:00"), now), "Il y a 10 min");
});

test("les KPI filtrent la même liste que le tableau de suivi", () => {
  const tasks = [
    { ownerId: "a", status: "TODO" as const, dueAt: new Date("2026-09-10"), updatedAt: now },
    { ownerId: "a", status: "IN_PROGRESS" as const, dueAt: new Date("2026-09-16"), updatedAt: now },
    { ownerId: "b", status: "DONE" as const, dueAt: null, updatedAt: now },
  ];
  assert.equal(filterFollowTasks(tasks, { status: "DONE" }).length, 1);
  assert.equal(filterFollowTasks(tasks, { overdue: true }, now).length, 1);
  assert.equal(followTasksHref({ owner: "a", status: "TODO" }), "/direction/taches?owner=a&status=TODO");
  assert.equal(followTasksHref({ late: "1" }), "/direction/taches?late=1");
});

test("seule la direction peut commenter une tâche assignée", () => {
  assert.equal(canDirectorCommentOnAssignedTask("MANAGER"), true);
  assert.equal(canDirectorCommentOnAssignedTask("OWNER"), true);
  assert.equal(canDirectorCommentOnAssignedTask("SALES"), false);
});
