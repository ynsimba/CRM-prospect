import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSuiviColumns, suiviCardTitle, suiviHref, SUIVI_BOARD_COLUMNS } from "./suivi-logic";

test("le board Suivi Prospect a Non catégorisée puis les 5 statuts Safecheck", () => {
  assert.deepEqual(
    SUIVI_BOARD_COLUMNS.map((column) => column.name),
    ["Non catégorisée", "Opportunité", "Lead", "Pipeline", "Finalisé", "Rejeté"],
  );
});

test("titre de carte = entreprise, sinon nom du prospect", () => {
  assert.equal(
    suiviCardTitle({ firstName: "Neisse", lastName: "ENGANI", company: { name: "Rawbank" } }),
    "Rawbank",
  );
  assert.equal(suiviCardTitle({ firstName: "Neisse", lastName: "ENGANI", company: null }), "Neisse ENGANI");
});

test("les prospects hors étapes Safecheck vont dans Non catégorisée", () => {
  const columns = buildSuiviColumns(
    [
      {
        id: "p1",
        firstName: "Amina",
        lastName: "Kalala",
        company: { name: "Safecheck" },
        owner: { name: "Amina" },
        status: { id: "s-old", slug: "nouveau" },
      },
      {
        id: "p2",
        firstName: "Paul",
        lastName: "Ilunga",
        company: { name: "Rawbank" },
        owner: { name: "Paul" },
        status: { id: "s-lead", slug: "lead" },
      },
    ],
    [
      { id: "s-opp", slug: "opportunite" },
      { id: "s-lead", slug: "lead" },
      { id: "s-pipe", slug: "pipeline" },
      { id: "s-fin", slug: "finalise" },
      { id: "s-rej", slug: "rejete" },
    ],
  );

  assert.equal(columns[0].items.length, 1);
  assert.equal(columns[0].items[0].title, "Safecheck");
  assert.equal(columns[0].droppable, false);
  assert.equal(columns[2].name, "Lead");
  assert.equal(columns[2].items[0].title, "Rawbank");
  assert.equal(columns[2].droppable, true);
  assert.equal(columns[2].statusId, "s-lead");
});

test("liens de filtre / tri du suivi", () => {
  assert.equal(suiviHref({ sort: "name" }, { q: "raw" }), "/suivi?sort=name&q=raw");
  assert.equal(suiviHref({ status: "lead", q: "x" }, { q: undefined, status: undefined }), "/suivi");
});
