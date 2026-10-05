import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canFullyEditProspect,
  emptyProspectFields,
  filterProspectProfilePatch,
  isBlankField,
  isProspectIncomplete,
  lockedProspectFields,
} from "@/lib/prospect-edit-policy";

describe("prospect-edit-policy", () => {
  it("détecte les champs vides et les fiches incomplètes", () => {
    assert.equal(isBlankField(null), true);
    assert.equal(isBlankField(""), true);
    assert.equal(isBlankField("—"), true);
    assert.equal(isBlankField("Kinshasa"), false);
    assert.equal(isProspectIncomplete({ city: "Kinshasa", industry: null }), true);
    assert.equal(
      isProspectIncomplete({
        jobTitle: "DG",
        email: "a@b.cd",
        phone: "1",
        whatsapp: "1",
        city: "Kinshasa",
        address: "Av.",
        industry: "BTP",
        companySize: "10",
        notes: "ok",
        firstContactAt: new Date("2026-01-01"),
        nextContactAt: new Date("2026-01-02"),
      }),
      false,
    );
  });

  it("verrouille les champs déjà remplis pour le commercial", () => {
    const values = { city: "Kinshasa", industry: null, email: "a@b.cd" };
    assert.deepEqual(lockedProspectFields("SALES", values).sort(), ["city", "email"].sort());
    assert.deepEqual(emptyProspectFields(values).includes("industry"), true);
    assert.deepEqual(lockedProspectFields("MANAGER", values), []);
    assert.equal(canFullyEditProspect("OWNER"), true);
    assert.equal(canFullyEditProspect("SALES"), false);
  });

  it("autorise le commercial à remplir uniquement le vide", () => {
    const current = { city: "Kinshasa", industry: null as string | null, phone: null as string | null };
    const allowed = filterProspectProfilePatch("SALES", current, {
      city: "Kinshasa",
      industry: "BTP",
      phone: "099",
    });
    assert.deepEqual(allowed, { industry: "BTP", phone: "099" });
  });

  it("refuse l’écrasement d’un champ rempli par le commercial", () => {
    assert.throws(
      () =>
        filterProspectProfilePatch("SALES", { city: "Kinshasa" }, { city: "Lubumbashi" }),
      /déjà renseigné/,
    );
  });

  it("laisse la direction tout modifier", () => {
    const patch = filterProspectProfilePatch(
      "MANAGER",
      { city: "Kinshasa", industry: "BTP" },
      { city: "Lubumbashi", industry: "Services" },
    );
    assert.deepEqual(patch, { city: "Lubumbashi", industry: "Services" });
  });
});
