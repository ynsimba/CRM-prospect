import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STAFF_EMAIL_EXAMPLE,
  isStaffEmail,
  normalizeStaffEmail,
  staffEmailFromName,
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
  assert.equal(normalizeStaffEmail("N.Engani@Safecheck-RDC.com"), "n.engani@safecheck-rdc.com");
  assert.equal(STAFF_EMAIL_EXAMPLE, "p.nom@safecheck-rdc.com");
  assert.match(staffEmailMessage(), /p\.nom@safecheck-rdc\.com/);
});

test("e-mail agent déduit du prénom et du nom", () => {
  assert.equal(staffEmailFromName("Neisse", "Engani"), "n.engani@safecheck-rdc.com");
  assert.equal(staffEmailFromName("  Françis ", "BALUMENE"), "f.balumene@safecheck-rdc.com");
  assert.equal(staffEmailFromName("Élodie", "Kabila Mbuyi"), "e.kabila-mbuyi@safecheck-rdc.com");
  assert.equal(staffEmailFromName("Jean", "N'Kolo"), "j.nkolo@safecheck-rdc.com");
  assert.equal(staffEmailFromName("", "Engani"), "");
  assert.equal(staffEmailFromName("Neisse", ""), "");
  assert.ok(isStaffEmail(staffEmailFromName("Élodie", "Kabila Mbuyi")));
});
