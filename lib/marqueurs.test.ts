import { test } from "node:test";
import assert from "node:assert/strict";
import { maskText, MARQUEURS } from "./mask";
import { evaluateRules } from "./rules";

test("maskText n'utilise que les marqueurs exportés", () => {
  const sortie = maskText(
    "Envoyez 5000 FCFA au 77 123 45 67 via https://wave-gain.xyz, code 4821, de la part de Moussa Diop"
  );
  const trouves = sortie.match(/\[[A-Z_]+\]/g) ?? [];
  const valeurs: string[] = Object.values(MARQUEURS);
  assert.equal(trouves.length, 5);
  for (const m of trouves) assert.ok(valeurs.includes(m), m);
});

test("rules reconnaît les marqueurs produits par le masquage", () => {
  const lien = evaluateRules(`Wave vous informe : ${MARQUEURS.lien}`);
  assert.ok(lien.signaux.some((s) => s.code === "regle_lien_usurpation"));

  const argent = evaluateRules(`Envoyez ${MARQUEURS.montant}`);
  assert.ok(argent.signaux.some((s) => s.code === "regle_demande_argent"));
});

