import assert from "node:assert/strict";
import { test } from "node:test";
import { PERMISSIONS, roleHasPermission } from "./permissions";

test("un commercial ne gère pas les utilisateurs", () => {
  assert.equal(roleHasPermission("SALES", PERMISSIONS.usersManage), false);
  assert.equal(roleHasPermission("SALES", PERMISSIONS.prospectsManage), true);
});

test("un manager gère l’équipe mais pas le SaaS", () => {
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.usersManage), true);
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.saasAdmin), false);
});

test("l’admin org n’a pas saas.admin", () => {
  assert.equal(roleHasPermission("OWNER", PERMISSIONS.settingsManage), true);
  assert.equal(roleHasPermission("OWNER", PERMISSIONS.saasAdmin), false);
  assert.equal(roleHasPermission("SUPER_ADMIN", PERMISSIONS.saasAdmin), true);
});
