import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCacheKey, estSortieDeRepli } from "./llm";
import type { LLMOutput } from "./llm";

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

test("estSortieDeRepli renvoie false pour un objet quelconque conforme au schéma", () => {
  const sortieNormale: LLMOutput = {
    niveau: "suspect",
    signaux: ["Demande de code confidentiel"],
    explication: "Le message demande des identifiants sensibles.",
    conduite_id: "conduite_suspicion_generale",
  };

  assert.equal(estSortieDeRepli(sortieNormale), false);

  // Même avec un contenu identique au repli par défaut, la comparaison par référence renvoie false
  const copieRepli: LLMOutput = {
    niveau: "suspect",
    signaux: ["Analyse automatique non concluante"],
    explication:
      "L'analyse n'a pas pu produire un résultat fiable. Par précaution, ce message est considéré comme suspect. Contactez votre opérateur via son canal officiel.",
    conduite_id: "conduite_suspicion_generale",
  };

  assert.equal(estSortieDeRepli(copieRepli), false);
});

