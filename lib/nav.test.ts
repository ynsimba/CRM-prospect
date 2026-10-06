import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DIRECTION_NAV,
  SALES_NAV,
  extraMainNav,
  isNavActive,
  mobileQuickAction,
  mobileTabsForRole,
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
      "Tous les contacts",
      "Ajouter un contact",
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

test("le super admin a les droits admin, le journal et les utilisateurs", () => {
  const { config } = navForRole("SUPER_ADMIN");
  assert.equal(showCommercialModule("SUPER_ADMIN"), true);
  assert.equal(showDirectionModule("SUPER_ADMIN"), true);
  assert.ok(config.some((item) => item.href === "/utilisateurs"));
  assert.ok(config.some((item) => item.href === "/journal"));
  assert.ok(!config.some((item) => item.href === "/admin"));
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
      "Notes partagées",
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

test("la fiche contact n’active pas Ajouter contact", () => {
  assert.equal(isNavActive("/contacts", "/contacts/abc", SALES_NAV), true);
  assert.equal(isNavActive("/contacts/nouveau", "/contacts/abc", SALES_NAV), false);
  assert.equal(isNavActive("/contacts/nouveau", "/contacts/nouveau", SALES_NAV), true);
  assert.equal(isNavActive("/contacts", "/contacts/nouveau", SALES_NAV), false);
});

test("modules Airtable : direction masquée au délégué commercial", () => {
  assert.deepEqual(
    visibleSidebarModules("SALES").map((item) => item.label),
    ["Fil de Discussion"],
  );
  assert.deepEqual(
    visibleSidebarModules("TEAM_LEAD").map((item) => item.label),
    ["Mon équipe commerciale", "Fil de Discussion"],
  );
  assert.deepEqual(visibleSidebarModules("MANAGER").map((item) => item.label), ["Fil de Discussion"]);
  assert.ok(DIRECTION_NAV.some((item) => item.href === "/notes"));
  assert.ok(DIRECTION_NAV.some((item) => item.href === "/direction/assignation"));
  assert.equal(isNavActive("/direction", "/direction/taches", DIRECTION_NAV), false);
  assert.equal(isNavActive("/direction/taches", "/direction/taches/departement", DIRECTION_NAV), false);
  assert.equal(isNavActive("/direction/taches/departement", "/direction/taches/departement", DIRECTION_NAV), true);
  assert.ok(extraMainNav("OWNER").some((item) => item.href === "/pipeline"));
  assert.ok(!extraMainNav("OWNER").some((item) => item.href === "/prospects"));
});

test("la barre d’onglets mobile suit l’espace de travail du rôle", () => {
  assert.deepEqual(
    mobileTabsForRole("SALES").map((item) => item.href),
    ["/", "/prospects", "/taches"],
  );
  assert.equal(mobileQuickAction("SALES").href, "/prospects/nouveau");
  assert.deepEqual(
    mobileTabsForRole("MANAGER").map((item) => item.href),
    ["/direction", "/direction/prospects", "/direction/taches"],
  );
  assert.equal(mobileQuickAction("MANAGER").href, "/direction/assignation");
  // L’onglet Tâches de la Direction ne s’allume pas sur la fiche d’un prospect.
  const tabs = mobileTabsForRole("MANAGER");
  assert.equal(isNavActive("/direction/prospects", "/direction/prospects", tabs), true);
  assert.equal(isNavActive("/direction", "/direction/prospects", tabs), false);
});
