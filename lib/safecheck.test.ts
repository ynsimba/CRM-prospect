import assert from "node:assert/strict";
import { test } from "node:test";
import {
  daysRemainingLabel,
  dormantLabel,
  formatDisplayCode,
  historySummary,
  isArchivedProspect,
  isDormantProspect,
  mapStatusSlug,
  monthsBetween,
  needsRelance,
  relanceLabel,
} from "./safecheck";

const created = new Date("2025-01-01T12:00:00");

test("mappe les anciens statuts vers Safecheck", () => {
  assert.equal(mapStatusSlug("nouveau"), "opportunite");
  assert.equal(mapStatusSlug("contacte"), "lead");
  assert.equal(mapStatusSlug("qualifie"), "pipeline");
  assert.equal(mapStatusSlug("perdu"), "rejete");
  assert.equal(mapStatusSlug("converti"), "finalise");
});

test("relance à 3 mois, dormant à 6 mois", () => {
  const now = new Date("2026-08-28T12:00:00");
  assert.equal(
    needsRelance({ createdAt: created, lastActionAt: new Date("2026-05-01T12:00:00") }, now),
    true,
  );
  assert.equal(
    needsRelance({ createdAt: created, lastActionAt: new Date("2026-08-01T12:00:00") }, now),
    false,
  );
  assert.equal(
    isDormantProspect({ createdAt: created, lastActionAt: new Date("2026-01-01T12:00:00") }, now),
    true,
  );
  assert.equal(
    isDormantProspect({ createdAt: created, lastActionAt: new Date("2026-04-01T12:00:00") }, now),
    false,
  );
  assert.equal(
    isDormantProspect(
      { createdAt: created, lastActionAt: new Date("2026-01-01T12:00:00"), isConverted: true },
      now,
    ),
    false,
  );
  assert.equal(relanceLabel({ createdAt: created, lastActionAt: new Date("2026-01-01T12:00:00") }, now), "⚠️ Relance nécessaire");
  assert.equal(relanceLabel({ createdAt: created, lastActionAt: new Date("2026-08-01T12:00:00") }, now), "");
  assert.match(dormantLabel({ createdAt: created, lastActionAt: new Date("2026-01-01T12:00:00") }, now), /6 mois/);
});

test("archive 15 j après rejeté, 30 j après finalisé", () => {
  const now = new Date("2026-08-28T12:00:00");
  assert.equal(
    isArchivedProspect(
      { createdAt: created, lastActionAt: new Date("2026-08-01T12:00:00"), slug: "rejete", isLost: true },
      now,
    ),
    true,
  );
  assert.equal(
    isArchivedProspect(
      { createdAt: created, lastActionAt: new Date("2026-08-20T12:00:00"), slug: "rejete", isLost: true },
      now,
    ),
    false,
  );
  assert.equal(
    isArchivedProspect(
      { createdAt: created, lastActionAt: new Date("2026-07-20T12:00:00"), slug: "finalise", isConverted: true },
      now,
    ),
    true,
  );
  assert.equal(
    isArchivedProspect(
      { createdAt: created, lastActionAt: new Date("2026-08-20T12:00:00"), slug: "finalise", isConverted: true },
      now,
    ),
    false,
  );
});

test("jours restants d’une tâche", () => {
  const now = new Date("2026-08-28T12:00:00");
  assert.match(daysRemainingLabel(new Date("2026-08-20T12:00:00"), now), /En retard de 8/);
  assert.match(daysRemainingLabel(new Date("2026-08-28T18:00:00"), now), /aujourd/);
  assert.match(daysRemainingLabel(new Date("2026-08-30T12:00:00"), now), /2 jour/);
});

test("codes lisibles, résumé historique et mois calendaires", () => {
  assert.equal(formatDisplayCode("ENT", 7), "ENT-007");
  assert.equal(historySummary("Rawbank", new Date("2026-08-28T12:00:00")), "Rawbank - 28/08/2026");
  assert.equal(historySummary("Rawbank"), "Rawbank");
  assert.equal(monthsBetween(new Date("2026-01-31"), new Date("2026-03-01")), 1);
});
