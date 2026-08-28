import assert from "node:assert/strict";
import { test } from "node:test";
import { groupProspects, needsFollowUpAlert, parseProspectListView, prospectListHref } from "./prospect-list-logic";

test("vue liste : onglet perso, groupement et tri", () => {
  const view = parseProspectListView({ mine: "1", group: "status", sort: "name", density: "compact" });
  assert.equal(view.mine, true);
  assert.equal(view.group, "status");
  assert.equal(view.sort, "name");
  assert.equal(view.density, "compact");
  assert.equal(parseProspectListView({ group: "inconnu" }).group, "");
  assert.equal(parseProspectListView({}).sort, "updated");
});

test("construit l’URL en conservant les filtres", () => {
  assert.equal(prospectListHref({ q: "raw", mine: "1" }, { mine: undefined }), "/prospects?q=raw");
  assert.equal(prospectListHref({ q: "raw" }, { mine: "1" }), "/prospects?q=raw&mine=1");
});

test("regroupe les prospects par entreprise", () => {
  const groups = groupProspects(
    [
      { city: "Gombe", company: { name: "Rawbank" }, status: { name: "Nouveau" }, source: null, owner: null },
      { city: "Gombe", company: { name: "Rawbank" }, status: { name: "Contacté" }, source: null, owner: null },
      { city: "Limete", company: null, status: { name: "Nouveau" }, source: null, owner: null },
    ],
    "company",
  );
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "Rawbank");
  assert.equal(groups[0].items.length, 2);
  assert.equal(groups[1].label, "Sans entreprise");
});

test("alerte relance si pas de RDV ou date dépassée", () => {
  const now = new Date("2026-08-28T12:00:00Z");
  assert.equal(needsFollowUpAlert({ nextContactAt: null }, now), true);
  assert.equal(needsFollowUpAlert({ nextContactAt: new Date("2026-08-20T12:00:00Z") }, now), true);
  assert.equal(needsFollowUpAlert({ nextContactAt: new Date("2026-09-01T12:00:00Z") }, now), false);
  assert.equal(needsFollowUpAlert({ nextContactAt: null, isConverted: true }, now), false);
});
