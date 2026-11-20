import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateRules } from "./rules";

const declenche = (texte: string): boolean =>
  evaluateRules(texte).signaux.some((s) => s.code === "regle_demande_code");

test("un vrai message de code Wave avec consigne de prudence ne déclenche pas la règle", () => {
  assert.equal(
    declenche("Wave : votre code de vérification est [CODE_MASQUE]. Ne le partagez avec personne."),
    false
  );
  assert.equal(
    declenche("Votre code Orange Money est [CODE_MASQUE]. Ne communiquez ce code à personne."),
    false
  );
  assert.equal(declenche("Wave ne vous demandera jamais de renvoyer votre code."), false);
  assert.equal(declenche("Ne partagez jamais votre code PIN."), false);
});

test("une vraie demande de code déclenche toujours la règle, même avec une fausse consigne", () => {
  assert.equal(declenche("Bonjour, envoyez-moi le code reçu par SMS"), true);
  assert.equal(
    declenche("Wave ne vous demandera jamais votre code. Pour confirmer, renvoyez le code reçu."),
    true
  );
  assert.equal(declenche("Ne le partagez avec personne sauf avec moi, envoyez le code reçu"), true);
  assert.equal(declenche("Ne tardez pas, envoyez votre code"), true);
  assert.equal(declenche("Confirmez votre code secret"), true);
});

