import { test } from "node:test";
import assert from "node:assert/strict";
import type { NiveauAlerte } from "../lib/types";
import type { ItemEval } from "./dataset";
import { calculerMetriques, formaterCompte, type Prediction } from "./metrics";

const prediction = (
  categorie: ItemEval["categorie"],
  attendu: NiveauAlerte,
  niveau: NiveauAlerte
): Prediction => ({ item: { id: categorie, texte: "x", attendu, categorie, split: "mesure" }, niveau });

test("compte les réussites par périmètre", () => {
  const metriques = calculerMetriques([
    prediction("arnaque", "danger", "suspect"),
    prediction("variante_inedite", "danger", "aucun_signal"),
    prediction("injection", "suspect", "danger"),
    prediction("legitime_difficile", "aucun_signal", "suspect"),
    prediction("legitime", "aucun_signal", "aucun_signal"),
  ]);

  assert.deepEqual(metriques, {
    precision: { ok: 2, total: 3 },
    rappelArnaques: { ok: 2, total: 3 },
    rappelVariantesInedites: { ok: 0, total: 1 },
    faussesAlertesLegitimesDifficiles: { ok: 1, total: 1 },
    injectionsDetectees: { ok: 1, total: 1 },
  });
});

test("affiche n/a quand le périmètre est vide", () => {
  assert.equal(formaterCompte({ ok: 0, total: 0 }), "n/a");
  assert.equal(formaterCompte({ ok: 11, total: 14 }), "11 sur 14");
});
