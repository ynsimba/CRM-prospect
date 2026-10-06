import assert from "node:assert/strict";
import { test } from "node:test";
import { PASSWORD_MIN_LENGTH, passwordChangeError } from "./password-policy";

test("un changement de mot de passe exige l’actuel, 8 caractères, une valeur nouvelle et confirmée", () => {
  const ok = { current: "ancien123", next: "nouveau-456", confirm: "nouveau-456" };
  assert.equal(passwordChangeError(ok), null);
  assert.match(passwordChangeError({ ...ok, current: "" }) ?? "", /actuel/);
  assert.match(passwordChangeError({ ...ok, next: "court", confirm: "court" }) ?? "", new RegExp(String(PASSWORD_MIN_LENGTH)));
  assert.match(passwordChangeError({ ...ok, next: "ancien123", confirm: "ancien123" }) ?? "", /différent/);
  assert.match(passwordChangeError({ ...ok, confirm: "nouveau-457" }) ?? "", /confirmation/);
});
