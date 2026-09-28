import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DIRECTION_NAV,
  SALES_NAV,
  extraMainNav,
  isNavActive,
  navForRole,
  showCommercialModule,
  showDirectionModule,
  visibleSidebarModules,
} from "./nav";

test("un délégué commercial n’a que les modules du quotidien", () => {
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
      "Mes notes",
      "Archives",
    ],
  );
  assert.equal(config.length, 0);
  assert.equal(showCommercialModule("SALES"), true);
  assert.equal(showDirectionModule("SALES"), false);
});

test("l’admin garde la navigation complète", () => {
  const { main, config } = navForRole("OWNER");
  assert.ok(main.some((item) => item.href === "/pipeline"));
  assert.ok(config.some((item) => item.href === "/entreprises"));
  assert.ok(config.some((item) => item.href === "/utilisateurs" && item.label === "Utilisateurs"));
  assert.ok(!main.some((item) => item.href === "/admin"));
  assert.equal(showCommercialModule("OWNER"), true);
  assert.equal(showDirectionModule("OWNER"), true);
});

test("la direction n’a que son interface", () => {
  const { main, config } = navForRole("MANAGER");
  assert.deepEqual(
    main.map((item) => item.label),
    [
      "Tableau de bord",
      "Tous les Prospect",
      "Agents commerciaux",
      "Assignation Tâches",
      "Suivie des tâches",
      "Tâches par département",
      "Archives Task par département",
      "Archive Prospect",
    ],
  );
  assert.equal(config.length, 0);
  assert.equal(showCommercialModule("MANAGER"), false);
  assert.equal(showDirectionModule("MANAGER"), true);
  assert.equal(extraMainNav("MANAGER").length, 0);
});

test("la fiche prospect n’active pas Ajouter un prospect", () => {
  assert.equal(isNavActive("/prospects", "/prospects/abc", SALES_NAV), true);
  assert.equal(isNavActive("/prospects/nouveau", "/prospects/abc", SALES_NAV), false);
  assert.equal(isNavActive("/prospects/nouveau", "/prospects/nouveau", SALES_NAV), true);
  assert.equal(isNavActive("/prospects", "/prospects/nouveau", SALES_NAV), false);
});

test("modules Airtable : direction masquée au délégué commercial", () => {
  assert.deepEqual(
    visibleSidebarModules("SALES").map((item) => item.label),
    ["Mes Tâches", "Mes notes", "Fil de Discussion"],
  );
  assert.deepEqual(visibleSidebarModules("MANAGER").map((item) => item.label), ["Fil de Discussion"]);
  assert.ok(DIRECTION_NAV.some((item) => item.href === "/direction/assignation"));
  assert.equal(isNavActive("/direction", "/direction/taches", DIRECTION_NAV), false);
  assert.equal(isNavActive("/direction/taches", "/direction/taches/departement", DIRECTION_NAV), false);
  assert.equal(isNavActive("/direction/taches/departement", "/direction/taches/departement", DIRECTION_NAV), true);
  assert.ok(extraMainNav("OWNER").some((item) => item.href === "/pipeline"));
  assert.ok(!extraMainNav("OWNER").some((item) => item.href === "/prospects"));
});
