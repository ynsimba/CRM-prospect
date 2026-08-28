import assert from "node:assert/strict";
import { test } from "node:test";
import {
  followUpBucket,
  isContactActivity,
  monthGrid,
  nextTaskStatus,
  parseYearMonth,
  startOfDay,
} from "./activity-logic";

test("buckets de relance", () => {
  const today = startOfDay(new Date("2026-08-28T10:00:00"));
  assert.equal(followUpBucket(new Date("2026-08-27T18:00:00"), today), "overdue");
  assert.equal(followUpBucket(new Date("2026-08-28T09:00:00"), today), "today");
  assert.equal(followUpBucket(new Date("2026-08-30T09:00:00"), today), "upcoming");
});

test("cycle de statut tâche", () => {
  assert.equal(nextTaskStatus("TODO"), "IN_PROGRESS");
  assert.equal(nextTaskStatus("IN_PROGRESS"), "DONE");
  assert.equal(nextTaskStatus("DONE"), null);
});

test("activité de contact", () => {
  assert.equal(isContactActivity("CALL"), true);
  assert.equal(isContactActivity("NOTE"), false);
});

test("grille calendrier août 2026 commence un samedi", () => {
  const cells = monthGrid(2026, 7);
  assert.equal(cells.filter((day) => day !== null).length, 31);
  assert.equal(cells[5], 1);
});

test("parse mois", () => {
  assert.deepEqual(parseYearMonth("2026-08"), { year: 2026, monthIndex: 7 });
});
