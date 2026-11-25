import { test } from "node:test";
import assert from "node:assert/strict";
import { construireTextePartage, STYLES_VERDICT } from "./carte-image";

test("construireTextePartage formule un texte clair avec signaux et lien", () => {
  const texte = construireTextePartage("Danger", ["Lien suspect", "Urgence injustifiée"], "https://samm.sn");
  assert.equal(
    texte,
    "Sàmm a classé un message comme « Danger » : Lien suspect, Urgence injustifiée. Vérifiez vos messages suspects sur https://samm.sn"
  );
});

test("construireTextePartage gère une liste de signaux vide", () => {
  const texte = construireTextePartage("Aucun signal détecté", [], "https://samm.sn");
  assert.equal(
    texte,
    "Sàmm a classé un message comme « Aucun signal détecté » : aucun signal direct. Vérifiez vos messages suspects sur https://samm.sn"
  );
});

test("STYLES_VERDICT définit des couleurs et consignes pour tous les niveaux", () => {
  assert.equal(STYLES_VERDICT.danger.titre, "DANGER");
  assert.equal(STYLES_VERDICT.danger.fond, "#C4231A");
  assert.equal(STYLES_VERDICT.suspect.titre, "SUSPECT");
  assert.equal(STYLES_VERDICT.suspect.fond, "#F2A900");
  assert.equal(STYLES_VERDICT.aucun_signal.titre, "AUCUN SIGNAL DÉTECTÉ");
  assert.equal(STYLES_VERDICT.aucun_signal.fond, "#E3E7F0");
});
