import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  homePathForRole,
  isAdminRole,
  isDirectionRole,
  isSalesRole,
  canManageAgents,
} from "./roles";

test("l’app expose quatre niveaux d’accès", () => {
  assert.deepEqual(
    ASSIGNABLE_ROLES.map((role) => ROLE_LABELS[role]),
    ["Admin", "Direction", "Responsable commercial", "Délégué commercial"],
  );
  assert.equal(isAdminRole("OWNER"), true);
  assert.equal(isAdminRole("MANAGER"), false);
  assert.equal(isDirectionRole("MANAGER"), true);
  assert.equal(isDirectionRole("OWNER"), true);
  assert.equal(isDirectionRole("SALES"), false);
  assert.equal(isSalesRole("SALES"), true);
  // Le responsable commercial vend aussi, mais ne fait pas partie de la Direction.
  assert.equal(isSalesRole("TEAM_LEAD"), true);
  assert.equal(isDirectionRole("TEAM_LEAD"), false);
  assert.equal(canManageAgents("TEAM_LEAD"), true);
  assert.equal(canManageAgents("SALES"), false);
  assert.equal(canManageAgents("MANAGER"), true);
});

test("chaque rôle a sa page d’accueil", () => {
  assert.equal(homePathForRole("OWNER"), "/");
  assert.equal(homePathForRole("MANAGER"), "/direction");
  assert.equal(homePathForRole("SALES"), "/");
  assert.equal(homePathForRole("SUPER_ADMIN"), "/admin");
});
