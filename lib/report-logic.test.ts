import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildFunnel,
  conversionPercent,
  funnelFromProspects,
  last12MonthBuckets,
  lastNDayCounts,
  lastNWeekCounts,
  sourceReport,
  type ReportProspect,
} from "./report-logic";

test("taux de conversion à une décimale", () => {
  assert.equal(conversionPercent(15, 120), 12.5);
  assert.equal(conversionPercent(20, 80), 25);
  assert.equal(conversionPercent(0, 0), 0);
});

test("entonnoir : taux global et d’étape", () => {
  const funnel = buildFunnel([
    { label: "Prospects", value: 100 },
    { label: "Contactés", value: 40 },
    { label: "Clients", value: 10 },
  ]);
  assert.equal(funnel[1].rate, 40);
  assert.equal(funnel[1].stepRate, 40);
  assert.equal(funnel[2].rate, 10);
  assert.equal(funnel[2].stepRate, 25);
});

test("rapport sources trié par volume", () => {
  const rows: ReportProspect[] = [
    { statusSlug: "nouveau", isConverted: false, lastContactAt: null, sourceName: "WhatsApp", opportunityCount: 0, wonOpportunity: false },
    { statusSlug: "converti", isConverted: true, lastContactAt: new Date(), sourceName: "WhatsApp", opportunityCount: 1, wonOpportunity: true },
    { statusSlug: "qualifie", isConverted: false, lastContactAt: new Date(), sourceName: "Facebook", opportunityCount: 0, wonOpportunity: false },
  ];
  const sources = sourceReport(rows);
  assert.equal(sources[0].name, "WhatsApp");
  assert.equal(sources[0].prospects, 2);
  assert.equal(sources[0].clients, 1);
  assert.equal(sources[0].conversion, 50);
  const funnel = funnelFromProspects(rows);
  assert.equal(funnel[0].value, 3);
  assert.equal(funnel[4].value, 1);
});

test("buckets 12 mois et 7 jours", () => {
  const now = new Date(2026, 7, 28);
  const months = last12MonthBuckets([new Date(2026, 7, 2), new Date(2026, 6, 15)], now);
  assert.equal(months.length, 12);
  assert.equal(months[11].label, "Août");
  assert.equal(months[11].value, 1);
  assert.equal(months[10].label, "Juil");
  assert.equal(months[10].value, 1);

  const spark = lastNDayCounts([new Date(2026, 7, 28), new Date(2026, 7, 27), new Date(2026, 7, 27)], 7, now);
  assert.equal(spark.length, 7);
  assert.equal(spark[6], 1);
  assert.equal(spark[5], 2);

  const weeks = lastNWeekCounts(
    [new Date(2026, 7, 28), new Date(2026, 7, 20), new Date(2026, 7, 6)],
    4,
    now,
  );
  assert.equal(weeks.length, 4);
  assert.equal(weeks[3], 1);
  assert.equal(weeks[2], 1);
  assert.equal(weeks[0], 1);
});
