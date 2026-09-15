import assert from "node:assert/strict";
import { test } from "node:test";
import { noteExcerpt, noteTitleFrom, sanitizeNoteHtml } from "./notes-logic";

test("l’éditeur n’accepte que du HTML sûr", () => {
  const html = sanitizeNoteHtml(
    `<p onclick="alert(1)">Relancer <strong>ABC</strong></p><script>alert(1)</script><a href="javascript:alert(1)">x</a><a href="/taches">Mes tâches</a>`,
  );
  assert.equal(html.includes("script"), false);
  assert.equal(html.includes("onclick"), false);
  assert.equal(html.includes("javascript:"), false);
  assert.match(html, /<strong>ABC<\/strong>/);
  assert.match(html, /href="\/taches"/);
});

test("extrait un aperçu lisible", () => {
  assert.equal(noteExcerpt("<p>Compte-rendu visite</p>"), "Compte-rendu visite");
  assert.equal(noteExcerpt("<p></p>"), "Note vide");
  assert.equal(noteTitleFrom("  "), "Sans titre");
  assert.equal(noteTitleFrom("Visite Gombe"), "Visite Gombe");
});
