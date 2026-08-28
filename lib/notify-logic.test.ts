import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeNotificationBody, encodeNotificationBody, HOT_SCORE } from "./notify-logic";

test("encode / decode avec lien", () => {
  const body = encodeNotificationBody("Relance Béatrice", "/prospects/abc");
  assert.equal(body, "/prospects/abc\nRelance Béatrice");
  assert.deepEqual(decodeNotificationBody(body), {
    href: "/prospects/abc",
    text: "Relance Béatrice",
  });
});

test("decode sans lien", () => {
  assert.deepEqual(decodeNotificationBody("Simple message"), {
    href: null,
    text: "Simple message",
  });
});

test("seuil lead très chaud", () => {
  assert.equal(HOT_SCORE, 81);
});
