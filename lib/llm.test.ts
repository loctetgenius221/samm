import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCacheKey } from "./llm";

test("buildCacheKey génère des clés différentes lorsque seul le système change", () => {
  const cleSystemeB = buildCacheKey("v1", "texte", "regles=1;recherche=1", "modele-a");
  const cleSystemeC = buildCacheKey("v1", "texte", "regles=0;recherche=0", "modele-a");

  assert.notEqual(cleSystemeB, cleSystemeC);
  assert.equal(cleSystemeB, "v1:::regles=1;recherche=1:::modele-a:::texte");
  assert.equal(cleSystemeC, "v1:::regles=0;recherche=0:::modele-a:::texte");
});

test("buildCacheKey génère des clés différentes lorsque seul le modèle change", () => {
  const cleModeleA = buildCacheKey("v1", "texte", "regles=1;recherche=1", "gpt-oss-120b");
  const cleModeleB = buildCacheKey("v1", "texte", "regles=1;recherche=1", "qwen");

  assert.notEqual(cleModeleA, cleModeleB);
});

