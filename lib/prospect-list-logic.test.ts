import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filterGridRows,
  gridColumnOptions,
  groupProspects,
  COMMERCIAL_GRID_COLUMNS,
  needsFollowUpAlert,
  parsePinnedColumn,
  parseProspectListView,
  prospectListHref,
  resolveProspectOwnerScope,
  sortGridRows,
  stickyColumnStyle,
} from "./prospect-list-logic";

function sampleRow(overrides: Partial<Parameters<typeof filterGridRows>[0][number]> = {}) {
  return {
    companyName: "Rawbank",
    industry: "Banque",
    address: "Gombe",
    city: "Kinshasa",
    lastActionAt: "2026-08-01T10:00:00.000Z",
    meetingAt: "2026-09-10T10:00:00.000Z",
    statusId: "lead",
    statusName: "Lead",
    notes: "Relancer",
    ownerId: "jean",
    ownerName: "Jean",
    needsFollowUp: false,
    ...overrides,
  };
}

test("vue liste : onglet perso, groupement et tri", () => {
  const view = parseProspectListView({ mine: "1", group: "status", sort: "name", density: "compact" });
  assert.equal(view.mine, true);
  assert.equal(view.group, "status");
  assert.equal(view.sort, "name");
  assert.equal(view.density, "compact");
  assert.equal(view.dir, "asc");
  assert.equal(parseProspectListView({ group: "inconnu" }).group, "");
  assert.equal(parseProspectListView({}).sort, "updated");
  assert.equal(parseProspectListView({}).dir, "desc");
  assert.equal(parseProspectListView({ sort: "lastAction", dir: "asc" }).sort, "lastAction");
  assert.equal(parseProspectListView({ mine: ["1"] }).mine, true);
});

test("filtre et trie les colonnes du tableau commercial", () => {
  const rows = [
    sampleRow(),
    sampleRow({
      companyName: "Vodacom",
      industry: "Télécom",
      address: "",
      lastActionAt: "2026-07-01T10:00:00.000Z",
      meetingAt: null,
      statusId: "pipeline",
      statusName: "Pipeline",
      notes: "",
      ownerId: "marie",
      ownerName: "Marie",
      needsFollowUp: true,
    }),
  ];
  assert.equal(filterGridRows(rows, { company: "Vodacom" }).length, 1);
  assert.equal(filterGridRows(rows, { address: "__empty__" })[0].companyName, "Vodacom");
  assert.equal(filterGridRows(rows, { followUp: "1" })[0].companyName, "Vodacom");
  assert.equal(filterGridRows(rows, { status: "Lead" }).length, 1);
  assert.equal(filterGridRows(rows, { meeting: "0" }).length, 1);
  assert.equal(sortGridRows(rows, "company", "asc")[0].companyName, "Rawbank");
  assert.equal(sortGridRows(rows, "company", "desc")[0].companyName, "Vodacom");
  assert.equal(sortGridRows(rows, "lastAction", "asc")[0].companyName, "Vodacom");
  const companyOptions = gridColumnOptions("company", rows);
  assert.ok(companyOptions.some((item) => item.value === "Rawbank"));
  assert.equal(gridColumnOptions("followUp", rows).length, 2);
  assert.ok(COMMERCIAL_GRID_COLUMNS.every((column) => column.filter));
});

test("Mes Prospects filtre toujours sur le commercial connecté", () => {
  const sales = { role: "SALES", userId: "jean" };
  const admin = { role: "OWNER", userId: "amina" };
  assert.deepEqual(resolveProspectOwnerScope(sales, { mine: true }), { ownerId: "jean" });
  assert.deepEqual(resolveProspectOwnerScope(admin, { mine: true }), { ownerId: "amina" });
  assert.deepEqual(resolveProspectOwnerScope(sales, { ownerId: "marie" }), { ownerId: "jean" });
  assert.deepEqual(resolveProspectOwnerScope(admin, { ownerId: "marie" }), { ownerId: "marie" });
  assert.deepEqual(resolveProspectOwnerScope(admin, {}), {});
});

test("fige les colonnes jusqu’à la colonne choisie", () => {
  assert.equal(parsePinnedColumn(undefined), "company");
  assert.equal(parsePinnedColumn("off"), "");
  assert.equal(parsePinnedColumn("status"), "status");
  assert.equal(parsePinnedColumn("inconnu"), "company");
  assert.deepEqual(stickyColumnStyle("company", "status"), { sticky: true, edge: false, left: 0 });
  assert.equal(stickyColumnStyle("industry", "status").sticky, true);
  assert.equal(stickyColumnStyle("status", "status").edge, true);
  assert.equal(stickyColumnStyle("notes", "status").sticky, false);
  assert.equal(stickyColumnStyle("industry", "company").sticky, false);
});

test("construit l’URL en conservant les filtres", () => {
  assert.equal(prospectListHref({ q: "raw", mine: "1" }, { mine: undefined }), "/prospects?q=raw");
  assert.equal(prospectListHref({ q: "raw" }, { mine: "1" }), "/prospects?q=raw&mine=1");
  assert.equal(prospectListHref({ mine: "1" }, { density: "compact" }), "/prospects?mine=1&density=compact");
  assert.equal(prospectListHref({ mine: "1", density: "compact" }, { density: undefined }), "/prospects?mine=1");
  assert.equal(prospectListHref({ mine: "1", density: "comfortable" }, { density: undefined }), "/prospects?mine=1");
  assert.equal(prospectListHref({ mine: "1" }, { pin: "status" }), "/prospects?mine=1&pin=status");
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

test("alerte relance uniquement à 3 mois sans action", () => {
  const now = new Date("2026-08-28T12:00:00Z");
  assert.equal(needsFollowUpAlert({ nextContactAt: null, createdAt: now }, now), false);
  assert.equal(needsFollowUpAlert({ nextContactAt: new Date("2026-08-20T12:00:00Z"), createdAt: now }, now), false);
  assert.equal(needsFollowUpAlert({ nextContactAt: null, isConverted: true, createdAt: now }, now), false);
  assert.equal(
    needsFollowUpAlert(
      { nextContactAt: null, lastActionAt: new Date("2026-01-01T12:00:00Z"), createdAt: new Date("2025-01-01") },
      now,
    ),
    true,
  );
});
