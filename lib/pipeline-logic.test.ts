import assert from "node:assert/strict";
import { test } from "node:test";
import {
  opportunityStatusFromStage,
  parseFcAmount,
  weightedAmount,
} from "./pipeline-logic";

test("valeur pondérée arrondie", () => {
  assert.equal(weightedAmount(10_000, 70), 7000);
  assert.equal(weightedAmount(8_500_000, 40), 3_400_000);
  assert.equal(weightedAmount(100, 0), 0);
});

test("étape gagnée / perdue / ouverte", () => {
  assert.equal(opportunityStatusFromStage({ isWon: true, isLost: false }), "WON");
  assert.equal(opportunityStatusFromStage({ isWon: false, isLost: true }), "LOST");
  assert.equal(opportunityStatusFromStage({ isWon: false, isLost: false }), "OPEN");
});

test("montant FC avec espaces", () => {
  assert.equal(parseFcAmount("8 500 000"), 8_500_000);
  assert.throws(() => parseFcAmount("abc"));
});
