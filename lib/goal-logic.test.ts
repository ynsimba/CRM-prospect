import assert from "node:assert/strict";
import { test } from "node:test";
import { compareReps, goalProgress, parseTargetInt } from "./goal-logic";

test("progression plafonnée à 100", () => {
  assert.equal(goalProgress(0, 10), 0);
  assert.equal(goalProgress(5, 10), 50);
  assert.equal(goalProgress(12, 10), 100);
  assert.equal(goalProgress(3, 0), 0);
});

test("classement CA puis prospects", () => {
  const jean = { wonRevenue: 18_000_000, prospects: 4, meetings: 1 };
  const marie = { wonRevenue: 0, prospects: 10, meetings: 2 };
  assert.ok(compareReps(jean, marie) < 0);
  assert.ok(compareReps(marie, jean) > 0);
});

test("objectifs entiers", () => {
  assert.equal(parseTargetInt("15", "Prospects"), 15);
  assert.equal(parseTargetInt("", "Prospects"), 0);
  assert.throws(() => parseTargetInt("12.5", "Prospects"));
});
