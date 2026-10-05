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

test("conserve police, couleur et alignement sûrs", () => {
  const html = sanitizeNoteHtml(
    `<p style="text-align: center" align="left"><span style="color: #4d8440; font-family: Georgia, serif; font-size: 18px">OK</span><span style="background-color: url(evil)">X</span></p><font face="Arial" color="#111111" size="4">A</font>`,
  );
  assert.match(html, /text-align: center/);
  assert.match(html, /color: #4d8440/);
  assert.match(html, /font-family: Georgia, serif/);
  assert.match(html, /font-size: 18px/);
  assert.equal(html.includes("url(evil)"), false);
  assert.match(html, /<span style="font-family: Arial; color: #111111; font-size: 18px">A<\/span>/);
});

test("extrait un aperçu lisible", () => {
  assert.equal(noteExcerpt("<p>Compte-rendu visite</p>"), "Compte-rendu visite");
  assert.equal(noteExcerpt("<p></p>"), "Note vide");
  assert.equal(noteTitleFrom("  "), "Sans titre");
  assert.equal(noteTitleFrom("Visite Gombe"), "Visite Gombe");
});
