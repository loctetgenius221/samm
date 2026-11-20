import { test } from "node:test";
import assert from "node:assert/strict";
import { masquerNoms } from "./noms";

const M = "[NOM_MASQUE]";

test("masque les noms du dictionnaire, seuls ou composés", () => {
  assert.equal(masquerNoms("reçu de Moussa Diop.", M), `reçu de ${M}.`);
  assert.equal(masquerNoms("Cheikh ou Modou ?", M), `${M} ou ${M} ?`);
  assert.equal(masquerNoms("Transfert de Ndeye Coumba Thiam", M), `Transfert de ${M}`);
  assert.equal(masquerNoms("Mamadou Ba vous écrit", M), `${M} vous écrit`);
  assert.equal(masquerNoms("MOUSSA DIOP a envoyé", M), `${M} a envoyé`);
});

test("masque un nom hors dictionnaire grâce au contexte", () => {
  assert.equal(masquerNoms("Bonjour Tamsir Gadiaga, urgent", M), `Bonjour ${M}, urgent`);
  assert.equal(masquerNoms("de la part de Fodé Dansokho", M), `de la part de ${M}`);
});

test("ne masque pas les opérateurs, villes ni marqueurs existants", () => {
  for (const texte of [
    "Votre compte Wave est bloqué",
    "Orange Money vous informe",
    "Bonjour Wave, merci",
    "Bonjour Client, envoyé à Dakar",
    "reçu de [NUMERO_MASQUE]",
    "Ba et Sy sont des lettres",
  ]) {
    assert.equal(masquerNoms(texte, M), texte);
  }
});

test("masque le nom après « je suis », « c'est » et derrière un prénom connu", () => {
  assert.equal(masquerNoms("Je suis Tamsir Gadiaga de la banque", M), `Je suis ${M} de la banque`);
  assert.equal(masquerNoms("C'est Fodé Dansokho, rappelez-moi", M), `C'est ${M}, rappelez-moi`);
  assert.equal(masquerNoms("Binta Gadiaga a envoyé 5000 F", M), `${M} a envoyé 5000 F`);
});

test("ne masque pas un titre ou un mot qui porte un signal pour les règles", () => {
  for (const texte of ["Je suis Agent Wave", "JE SUIS CONSEILLER ORANGE MONEY", "C'est Wave, votre compte est bloqué"]) {
    assert.equal(masquerNoms(texte, M), texte);
  }
});
