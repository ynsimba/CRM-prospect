import assert from "node:assert/strict";
import test from "node:test";
import { isSessionIdle, SESSION_IDLE_MS } from "./session-policy";

test("inactivité : moins de 15 min reste valide", () => {
  const now = Date.parse("2026-10-05T12:00:00.000Z");
  assert.equal(isSessionIdle(new Date(now - SESSION_IDLE_MS + 1_000), now), false);
});

test("inactivité : plus de 15 min expire", () => {
  const now = Date.parse("2026-10-05T12:00:00.000Z");
  assert.equal(isSessionIdle(new Date(now - SESSION_IDLE_MS - 1), now), true);
});

test("inactivité : lastSeenAt absent ne force pas l’expiration", () => {
  assert.equal(isSessionIdle(null), false);
  assert.equal(isSessionIdle(undefined), false);
});
