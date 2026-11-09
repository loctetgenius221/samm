import { test } from "node:test";
import assert from "node:assert/strict";
import type { ScamEntree } from "../lib/types";
import { erreursArnaque, erreursConduite, estDateIso, validerDonnees } from "./validate-data";

const conduites = new Set(["conduite_suspicion_generale"]);

const arnaque: ScamEntree = {
  id: "scam_test",
  operateur: "Wave",
  langue: "fr",
  canal: "SMS",
  niveau: "danger",
  resume: "Faux transfert puis demande du code reçu",
  exemple_masque: "Vous avez reçu [MONTANT_MASQUE]. Renvoyez-moi le code reçu.",
  signaux: ["Demande d'un code reçu par SMS"],
  conduite_id: "conduite_suspicion_generale",
  source: "https://exemple.org/article",
  date_source: "2022-01-14",
};

test("accepte une entrée complète et masquée", () => {
  assert.deepEqual(erreursArnaque(arnaque, conduites), []);
});

test("refuse une date hors format AAAA-MM-JJ", () => {
  assert.equal(estDateIso("2022-01-14"), true);
  assert.equal(estDateIso("TODO"), false);
  assert.equal(estDateIso("14/01/2022"), false);
});

test("détecte un numéro ou un montant laissé en clair", () => {
  const fuite = { ...arnaque, exemple_masque: "Envoie 5000 FCFA au 77 123 45 67" };
  assert.match(erreursArnaque(fuite, conduites).join(), /non masquées/);
});

test("signale une conduite inconnue et un champ manquant", () => {
  const erreurs = erreursArnaque({ ...arnaque, conduite_id: "inconnue", source: "" }, conduites);
  assert.equal(erreurs.length, 2);
});

test("exige une date sur un contact renseigné", () => {
  const contact = { type: "numero_vert", valeur: "800", source: "alerte", date_source: "TODO", a_verifier: true };
  assert.equal(erreursConduite({ id: "c", texte: "t", contacts: [contact] }).length, 1);
  assert.equal(erreursConduite({ id: "c", texte: "t", contacts: [{ ...contact, valeur: "" }] }).length, 0);
});

test("les données du dépôt sont conformes", () => {
  assert.deepEqual(validerDonnees(), []);
});
