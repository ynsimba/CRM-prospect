import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calendarCells,
  combineDateTime,
  datePart,
  formatDateDisplay,
  monthTitle,
  shiftMonth,
  timePart,
  todayIso,
  viewFromValue,
} from "./calendar-logic";

test("août 2026 commence un samedi et montre les jours voisins", () => {
  const cells = calendarCells(2026, 7);
  assert.equal(cells[0].key, "2026-07-27");
  assert.equal(cells[0].inMonth, false);
  assert.equal(cells[5].key, "2026-08-01");
  assert.equal(cells[5].inMonth, true);
  assert.ok(cells.some((cell) => cell.key === "2026-08-31" && cell.inMonth));
  assert.ok(cells.at(-1)?.key.startsWith("2026-09-"));
});

test("titre de mois et navigation", () => {
  assert.equal(monthTitle(2026, 7), "août 2026");
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, monthIndex: 11 });
  assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, monthIndex: 0 });
});

test("valeur date / heure", () => {
  assert.equal(datePart("2026-08-31T09:00"), "2026-08-31");
  assert.equal(timePart("2026-08-31T09:00"), "09:00");
  assert.equal(combineDateTime("2026-08-31", "09:00"), "2026-08-31T09:00");
  assert.equal(formatDateDisplay("2026-08-31"), "31/08/2026");
  assert.deepEqual(viewFromValue("2026-08-31"), { year: 2026, monthIndex: 7 });
  assert.equal(todayIso(new Date(2026, 7, 4)), "2026-08-04");
});
