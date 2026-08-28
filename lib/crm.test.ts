import assert from "node:assert/strict";
import { test } from "node:test";
import { computeLeadScore, computeProspectScore, parsePersonCategory, parseProspectFilters, scoreBand, slugify, whatsappHref } from "./crm";

test("score de base e-mail + téléphone + entreprise", () => {
  assert.equal(computeLeadScore({}), 0);
  assert.equal(computeLeadScore({ email: "a@b.cd" }), 10);
  assert.equal(computeLeadScore({ email: "a@b.cd", phone: "+243", companyId: "c1" }), 30);
});

test("bandes de score", () => {
  assert.equal(scoreBand(10), "Froid");
  assert.equal(scoreBand(45), "Tiède");
  assert.equal(scoreBand(70), "Chaud");
  assert.equal(scoreBand(90), "Très chaud");
});

test("filtres de liste ignorent les valeurs vides", () => {
  const filters = parseProspectFilters({
    q: "  kabila  ",
    status: "st1",
    priority: "URGENT",
    score: "chaud",
    city: "",
  });
  assert.equal(filters.q, "kabila");
  assert.equal(filters.statusId, "st1");
  assert.equal(filters.priority, "URGENT");
  assert.equal(filters.score, "chaud");
  assert.equal(filters.city, undefined);
});

test("priorité inconnue ignorée", () => {
  assert.equal(parseProspectFilters({ priority: "CRITICAL" }).priority, undefined);
});

test("slug et WhatsApp", () => {
  assert.equal(slugify("À relancer"), "a-relancer");
  assert.equal(whatsappHref("+243 810 300 001"), "https://wa.me/243810300001");
});

test("catégories personne de contact / porteur", () => {
  assert.equal(parsePersonCategory("contact"), "contact");
  assert.equal(parsePersonCategory("porteur"), "porteur");
  assert.equal(parsePersonCategory("autre"), undefined);
});

test("score avancé : WhatsApp, VIP, statut, relance en retard", () => {
  const now = new Date("2026-08-28T12:00:00Z");
  const hot = computeProspectScore({
    email: "a@b.cd",
    phone: "+243",
    whatsapp: "+243",
    companyId: "c1",
    jobTitle: "DG",
    priority: "URGENT",
    tags: ["VIP", "Hot Lead"],
    statusSlug: "qualifie",
    activityTypes: ["CALL", "MEETING"],
    lastContactAt: new Date("2026-08-25T12:00:00Z"),
    now,
  });
  assert.equal(hot.score, 100);
  assert.ok(hot.parts.some((part) => part.label === "VIP" && part.points === 15));

  const lost = computeProspectScore({
    email: "a@b.cd",
    statusSlug: "perdu",
    nextContactAt: new Date("2026-08-20T12:00:00Z"),
    now,
  });
  assert.equal(lost.score, 0);
  assert.ok(lost.parts.some((part) => part.label === "Non qualifié / perdu" && part.points === -20));
  assert.ok(lost.parts.some((part) => part.label === "Relance en retard" && part.points === -10));
});
