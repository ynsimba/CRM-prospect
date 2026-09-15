import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  homePathForRole,
  isAdminRole,
  isDirectionRole,
  isSalesRole,
} from "./roles";

test("l’app expose trois rôles utilisateurs", () => {
  assert.deepEqual(
    ASSIGNABLE_ROLES.map((role) => ROLE_LABELS[role]),
    ["Admin", "Direction", "Délégué commercial"],
  );
  assert.equal(isAdminRole("OWNER"), true);
  assert.equal(isAdminRole("MANAGER"), false);
  assert.equal(isDirectionRole("MANAGER"), true);
  assert.equal(isDirectionRole("OWNER"), true);
  assert.equal(isDirectionRole("SALES"), false);
  assert.equal(isSalesRole("SALES"), true);
});

test("chaque rôle a sa page d’accueil", () => {
  assert.equal(homePathForRole("OWNER"), "/");
  assert.equal(homePathForRole("MANAGER"), "/direction");
  assert.equal(homePathForRole("SALES"), "/");
  assert.equal(homePathForRole("SUPER_ADMIN"), "/admin");
});
