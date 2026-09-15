import assert from "node:assert/strict";
import { test } from "node:test";
import { applyThemeClass, resolveTheme, THEME_CLASS } from "./theme";

test("le thème enregistré l’emporte sur le système", () => {
  assert.equal(resolveTheme("dark", false), "dark");
  assert.equal(resolveTheme("light", true), "light");
});

test("sans préférence, le thème suit le système", () => {
  assert.equal(resolveTheme(null, true), "dark");
  assert.equal(resolveTheme("", false), "light");
  assert.equal(resolveTheme("other", true), "dark");
});

test("applique ou retire la classe sombre", () => {
  const tokens = new Set<string>();
  const root = {
    classList: {
      toggle(token: string, force?: boolean) {
        if (force) tokens.add(token);
        else tokens.delete(token);
      },
    },
  };
  applyThemeClass("dark", root);
  assert.equal(tokens.has(THEME_CLASS), true);
  applyThemeClass("light", root);
  assert.equal(tokens.has(THEME_CLASS), false);
});
