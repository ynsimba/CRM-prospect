import assert from "node:assert/strict";
import { test } from "node:test";
import { csvEscape, detectDelimiter, parseCsv, toCsv } from "./csv";

test("détecte point-virgule (Excel FR)", () => {
  assert.equal(detectDelimiter("Prénom;Nom;Email"), ";");
  assert.equal(detectDelimiter("a,b,c"), ",");
});

test("parse CSV avec quotes et point-virgule", () => {
  const text = 'Prénom;Nom;Ville\n"Jean;Marie";Dupont;"Gombe, Kin"\n';
  const parsed = parseCsv(text);
  assert.deepEqual(parsed.headers, ["Prénom", "Nom", "Ville"]);
  assert.equal(parsed.rows.length, 1);
  assert.deepEqual(parsed.rows[0], ["Jean;Marie", "Dupont", "Gombe, Kin"]);
});

test("ignore BOM et lignes vides", () => {
  const parsed = parseCsv("\uFEFFPrénom,Nom\nAlain,Tshibanda\n\n");
  assert.equal(parsed.delimiter, ",");
  assert.deepEqual(parsed.headers, ["Prénom", "Nom"]);
  assert.equal(parsed.rows.length, 1);
});

test("échappe les champs pour Excel", () => {
  assert.equal(csvEscape("Gombe", ";"), "Gombe");
  assert.equal(csvEscape('Dit "ok"', ";"), '"Dit ""ok"""');
  const csv = toCsv(["Nom"], [["A;B"]]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"A;B"'));
});
