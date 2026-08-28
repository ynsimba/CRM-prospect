import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCsv } from "./csv";
import {
  applyMapping,
  autoMapColumns,
  classifyImportRows,
  importStats,
  normalizeHeader,
} from "./import-logic";

test("normalise les en-têtes FR", () => {
  assert.equal(normalizeHeader("Prénom"), "prenom");
  assert.equal(normalizeHeader("E-mail"), "email");
  assert.equal(normalizeHeader("Téléphone"), "telephone");
});

test("mapping automatique du modèle", () => {
  const headers = [
    "Prénom",
    "Nom",
    "Entreprise",
    "Email",
    "Téléphone",
    "WhatsApp",
    "Ville",
    "Secteur",
    "Source",
    "Responsable",
  ];
  const mapping = autoMapColumns(headers);
  assert.equal(mapping.firstName, "Prénom");
  assert.equal(mapping.lastName, "Nom");
  assert.equal(mapping.company, "Entreprise");
  assert.equal(mapping.email, "Email");
  assert.equal(mapping.phone, "Téléphone");
  assert.equal(mapping.owner, "Responsable");
});

test("classifie erreurs, doublon fichier et doublon base", () => {
  const parsed = parseCsv(
    "Prénom;Nom;Entreprise;Email;Téléphone\n;SansPrenom;ABC;a@b.cd;+243 810 000 001\nJean;Dupont;ABC;mauvais;+243 810 000 002\nJean;Dupont;ABC;jean@abc.cd;+243 810 000 003\nJean;Dupont;ABC;jean@abc.cd;+243 810 000 004\nMarie;Kabila;XYZ;marie@xyz.cd;+243 810 300 002\n",
  );
  const mapping = autoMapColumns(parsed.headers);
  const mapped = applyMapping(parsed.headers, parsed.rows, mapping);
  const rows = classifyImportRows(mapped, [
    {
      firstName: "Marie",
      lastName: "Kabila",
      email: "marie@xyz.cd",
      phone: "+243 810 300 002",
      companyName: "XYZ",
    },
  ]);
  assert.equal(rows[0].issue, "missing-name");
  assert.equal(rows[1].issue, "invalid-email");
  assert.equal(rows[2].issue, null);
  assert.equal(rows[3].issue, "duplicate-file");
  assert.equal(rows[4].issue, "duplicate-db");
  const stats = importStats(rows);
  assert.equal(stats.ready, 1);
  assert.equal(stats.errors, 2);
  assert.equal(stats.duplicateFile, 1);
  assert.equal(stats.duplicateDb, 1);
});
