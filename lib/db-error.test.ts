import assert from "node:assert/strict";
import { test } from "node:test";
import { loginFailureMessage } from "./db-error";

test("message si Laravel n’est pas configuré", () => {
  const previous = process.env.LARAVEL_API_URL;
  delete process.env.LARAVEL_API_URL;
  assert.match(loginFailureMessage(new Error("connect ECONNREFUSED")), /LARAVEL_API_URL/);
  if (previous) process.env.LARAVEL_API_URL = previous;
});

test("message SESSION_SECRET", () => {
  assert.match(loginFailureMessage(new Error("SESSION_SECRET manquant ou trop court")), /SESSION_SECRET/);
});
