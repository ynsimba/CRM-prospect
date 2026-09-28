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

test("neutralise les formules à l’export mais garde téléphones et montants", () => {
  assert.equal(csvEscape("=HYPERLINK(\"http://x\")"), `"'=HYPERLINK(""http://x"")"`);
  assert.equal(csvEscape("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvEscape("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
  assert.equal(csvEscape("-2+3"), "'-2+3");
  assert.equal(csvEscape("+243 81 234 5678"), "+243 81 234 5678");
  assert.equal(csvEscape("-1500"), "-1500");
});
