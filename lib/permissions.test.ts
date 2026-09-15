import assert from "node:assert/strict";
import { test } from "node:test";
import { PERMISSIONS, roleHasPermission } from "./permissions";

test("un délégué commercial ne gère pas les utilisateurs", () => {
  assert.equal(roleHasPermission("SALES", PERMISSIONS.usersManage), false);
  assert.equal(roleHasPermission("SALES", PERMISSIONS.prospectsManage), true);
  assert.equal(roleHasPermission("SALES", PERMISSIONS.settingsManage), false);
});

test("la direction voit le CRM sans gérer les comptes ni le SaaS", () => {
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.prospectsManage), true);
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.usersManage), false);
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.settingsManage), false);
  assert.equal(roleHasPermission("MANAGER", PERMISSIONS.saasAdmin), false);
});

test("l’admin gère les comptes mais pas le SaaS", () => {
  assert.equal(roleHasPermission("OWNER", PERMISSIONS.usersManage), true);
  assert.equal(roleHasPermission("OWNER", PERMISSIONS.settingsManage), true);
  assert.equal(roleHasPermission("OWNER", PERMISSIONS.saasAdmin), false);
  assert.equal(roleHasPermission("SUPER_ADMIN", PERMISSIONS.saasAdmin), true);
});
