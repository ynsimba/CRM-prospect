import assert from "node:assert/strict";
import { test } from "node:test";
import { SALES_NAV, isNavActive, navForRole } from "./nav";

test("un commercial n’a que les 7 modules du quotidien", () => {
  const { main, config } = navForRole("SALES");
  assert.deepEqual(
    main.map((item) => item.label),
    [
      "Tableau de bord",
      "Tous les prospects",
      "Ajouter contact",
      "Ajouter un prospect",
      "Suivi prospect",
      "Mes tâches",
      "Archives",
    ],
  );
  assert.equal(config.length, 0);
});

test("l’admin org garde la navigation complète", () => {
  const { main, config } = navForRole("OWNER");
  assert.ok(main.some((item) => item.href === "/pipeline"));
  assert.ok(config.some((item) => item.href === "/entreprises"));
  assert.ok(!main.some((item) => item.href === "/admin"));
});

test("la fiche prospect n’active pas Ajouter un prospect", () => {
  assert.equal(isNavActive("/prospects", "/prospects/abc", SALES_NAV), true);
  assert.equal(isNavActive("/prospects/nouveau", "/prospects/abc", SALES_NAV), false);
  assert.equal(isNavActive("/prospects/nouveau", "/prospects/nouveau", SALES_NAV), true);
  assert.equal(isNavActive("/prospects", "/prospects/nouveau", SALES_NAV), false);
});
