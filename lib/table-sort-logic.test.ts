import { test } from "node:test";
import assert from "node:assert/strict";
import { compareKeys, nextDirection, sortKey } from "./table-sort-logic";

test("sortKey reconnaît dates, nombres, texte et cellules vides", () => {
  assert.deepEqual(sortKey(" — "), { kind: "empty" });
  assert.equal(sortKey("05/10/2026").kind, "date");
  assert.equal(sortKey("05/10/2026 14:30").kind, "date");
  assert.deepEqual(sortKey("1 250 $"), { kind: "number", value: 1250 });
  assert.deepEqual(sortKey("42,5 %"), { kind: "number", value: 42.5 });
  assert.deepEqual(sortKey("Neisse ENGANI"), { kind: "text", value: "Neisse ENGANI" });
});

test("compareKeys trie dates et nombres dans les deux sens", () => {
  const early = sortKey("01/09/2026");
  const late = sortKey("05/10/2026");
  assert.ok(compareKeys(early, late, "ascending") < 0);
  assert.ok(compareKeys(early, late, "descending") > 0);
  assert.ok(compareKeys(sortKey("9"), sortKey("10"), "ascending") < 0);
});

test("compareKeys ignore accents et casse et garde les vides en dernier", () => {
  assert.equal(compareKeys(sortKey("échanges"), sortKey("Echanges"), "ascending"), 0);
  assert.ok(compareKeys(sortKey("—"), sortKey("Zoé"), "ascending") > 0);
  assert.ok(compareKeys(sortKey("—"), sortKey("Zoé"), "descending") > 0);
});

test("nextDirection alterne croissant puis décroissant", () => {
  assert.equal(nextDirection(null), "ascending");
  assert.equal(nextDirection("ascending"), "descending");
  assert.equal(nextDirection("descending"), "ascending");
});
