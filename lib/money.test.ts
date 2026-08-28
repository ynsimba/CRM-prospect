import assert from "node:assert/strict";
import { test } from "node:test";
import { formatFc } from "./money";

test("format FC sans décimales", () => {
  const formatted = formatFc(6000);
  assert.match(formatted, /6[\s\u00a0\u202f]?000/);
  assert.match(formatted, /FC$/);
});

test("zéro franc", () => {
  assert.equal(formatFc(0), "0 FC");
});
