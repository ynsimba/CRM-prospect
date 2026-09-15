import assert from "node:assert/strict";
import { test } from "node:test";
import { loginFailureMessage } from "./db-error";

test("message Vercel si DATABASE_URL manque", () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
  };
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  delete process.env.POSTGRES_URL;
  assert.match(loginFailureMessage(new Error("connect ECONNREFUSED")), /DATABASE_URL/);
  if (previous.DATABASE_URL) process.env.DATABASE_URL = previous.DATABASE_URL;
  if (previous.POSTGRES_PRISMA_URL) process.env.POSTGRES_PRISMA_URL = previous.POSTGRES_PRISMA_URL;
  if (previous.POSTGRES_URL) process.env.POSTGRES_URL = previous.POSTGRES_URL;
});

test("message SESSION_SECRET", () => {
  assert.match(loginFailureMessage(new Error("SESSION_SECRET manquant ou trop court")), /SESSION_SECRET/);
});
