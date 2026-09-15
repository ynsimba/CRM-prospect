import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STAFF_EMAIL_EXAMPLE,
  isStaffEmail,
  normalizeStaffEmail,
  staffEmailMessage,
} from "./staff-email";

test("e-mail agent : initiale.nom @ safecheck-rdc.com", () => {
  assert.equal(isStaffEmail("n.engani@safecheck-rdc.com"), true);
  assert.equal(isStaffEmail("N.Engani@Safecheck-RDC.com"), true);
  assert.equal(isStaffEmail("a.kalala@safecheck-rdc.com"), true);
  assert.equal(isStaffEmail("f.balumene@safecheck-rdc.com"), true);
  assert.equal(isStaffEmail("n.kandolo@safecheck-rdc.com"), true);
  assert.equal(isStaffEmail("m.ngoy-mbala@safecheck-rdc.com"), true);
  assert.equal(isStaffEmail("jean@demo.cd"), false);
  assert.equal(isStaffEmail("nengani@safecheck-rdc.com"), false);
  assert.equal(isStaffEmail("n.engani@gmail.com"), false);
  assert.equal(isStaffEmail("n.engani@safecheck-rdc.com "), true);
  assert.equal(normalizeStaffEmail("N.Engani@Safecheck-RDC.com"), STAFF_EMAIL_EXAMPLE);
  assert.match(staffEmailMessage(), /n\.engani@safecheck-rdc\.com/);
});
