import { test } from "node:test";
import assert from "node:assert/strict";
import { fusionner, type Message } from "./fusion";

const message = (id: string, attendu?: Message["attendu"]): Message => ({
  id,
  texte: "x",
  categorie: "arnaque",
  split: "mesure",
  attendu,
});

test("retient le consensus et liste les désaccords", () => {
  const { items, desaccords, accord } = fusionner([message("a"), message("b"), message("c")], {
    moussa: { a: "danger", b: "danger", c: "suspect" },
    mouhammad: { a: "danger", b: "suspect" },
  });

  assert.deepEqual(items.map((i) => [i.id, i.attendu]), [["a", "danger"]]);
  assert.deepEqual(desaccords, [
    { id: "b", etiquettes: { moussa: "danger", mouhammad: "suspect" } },
    { id: "c", etiquettes: { moussa: "suspect", mouhammad: undefined } },
  ]);
  assert.deepEqual(accord, { ok: 1, total: 2 });
});

test("l'arbitrage dans messages.yaml l'emporte", () => {
  const { items } = fusionner([message("b", "suspect")], {
    moussa: { b: "danger" },
    mouhammad: { b: "aucun_signal" },
  });
  assert.equal(items[0].attendu, "suspect");
});
