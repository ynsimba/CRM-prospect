import assert from "node:assert/strict";
import { test } from "node:test";
import { loginFailureMessage } from "./db-error";

test("message Vercel si DATABASE_URL manque", () => {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  assert.match(loginFailureMessage(new Error("connect ECONNREFUSED")), /DATABASE_URL/);
  if (previous) process.env.DATABASE_URL = previous;
});

test("message SESSION_SECRET", () => {
  assert.match(loginFailureMessage(new Error("SESSION_SECRET manquant ou trop court")), /SESSION_SECRET/);
});
