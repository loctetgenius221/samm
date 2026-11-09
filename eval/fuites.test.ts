import { test } from "node:test";
import assert from "node:assert/strict";
import { mesurerFuites } from "./fuites";

test("compte les données encore visibles après masquage", () => {
  const mesure = mesurerFuites([
    { texte: "Moussa Diop t'envoie 5000 FCFA au 77 123 45 67", noms: ["Moussa Diop"], numeros: ["77 123 45 67"], montants: ["5000 FCFA"] },
  ]);

  assert.deepEqual(mesure.numeros, { masques: { ok: 1, total: 1 }, fuites: [] });
  assert.deepEqual(mesure.montants, { masques: { ok: 1, total: 1 }, fuites: [] });
  assert.deepEqual(mesure.noms, { masques: { ok: 0, total: 1 }, fuites: ["Moussa Diop"] });
});
