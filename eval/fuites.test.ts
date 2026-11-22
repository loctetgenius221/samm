import { test } from "node:test";
import assert from "node:assert/strict";
import { mesurerFuites } from "./fuites";

const masquerChiffres = (texte: string) => texte.replace(/\d[\d ]*\d/g, "#");

test("compte les données encore visibles après masquage, quel que soit le masqueur", () => {
  const mesure = mesurerFuites(
    [{ texte: "Awa Tine t'envoie 5000 FCFA au 77 123 45 67", noms_inconnus: ["Awa Tine"], numeros: ["77 123 45 67"], montants: ["5000 FCFA"] }],
    masquerChiffres
  );

  assert.deepEqual(mesure.numeros, { masques: { ok: 1, total: 1 }, fuites: [] });
  assert.deepEqual(mesure.montants, { masques: { ok: 1, total: 1 }, fuites: [] });
  assert.deepEqual(mesure.noms_inconnus, { masques: { ok: 0, total: 1 }, fuites: ["Awa Tine"] });
  assert.deepEqual(mesure.noms, { masques: { ok: 0, total: 0 }, fuites: [] });
});
