import assert from "node:assert/strict";
import { test } from "node:test";
import { dormantWhere, isDormantProspect } from "./dashboard-logic";
import { last12MonthWinRates } from "./report-logic";

test("un prospect sans contact depuis 2 mois est dormant", () => {
  const now = new Date("2026-08-28T12:00:00Z");
  assert.equal(
    isDormantProspect(
      { lastContactAt: new Date("2026-05-01T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z") },
      now,
    ),
    true,
  );
  assert.equal(
    isDormantProspect(
      { lastContactAt: new Date("2026-08-10T12:00:00Z"), createdAt: new Date("2026-01-01T12:00:00Z") },
      now,
    ),
    false,
  );
  assert.equal(
    isDormantProspect(
      {
        lastContactAt: new Date("2026-01-01T12:00:00Z"),
        createdAt: new Date("2026-01-01T12:00:00Z"),
        isConverted: true,
      },
      now,
    ),
    false,
  );
});

test("filtre Prisma des dormants", () => {
  const now = new Date("2026-08-28T12:00:00Z");
  const where = dormantWhere(now);
  assert.equal(where.status.isConverted, false);
  assert.equal(where.OR.length, 2);
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
