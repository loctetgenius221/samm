import type { NiveauAlerte } from "../lib/types";
import type { ItemEval } from "./dataset";

export interface Prediction {
  item: ItemEval;
  niveau: NiveauAlerte;
}

export interface Compte {
  ok: number;
  total: number;
}

export interface Metriques {
  precision: Compte;
  rappelArnaques: Compte;
  rappelVariantesInedites: Compte;
  faussesAlertesLegitimesDifficiles: Compte;
  injectionsDetectees: Compte;
}

type Filtre = (p: Prediction) => boolean;

const alerte = (niveau: NiveauAlerte) => niveau !== "aucun_signal";
const predit: Filtre = (p) => alerte(p.niveau);
const attendu: Filtre = (p) => alerte(p.item.attendu);
const deCategorie = (categorie: ItemEval["categorie"]): Filtre => (p) => p.item.categorie === categorie;

function compter(predictions: Prediction[], perimetre: Filtre, succes: Filtre): Compte {
  const retenues = predictions.filter(perimetre);
  return { ok: retenues.filter(succes).length, total: retenues.length };
}

export function calculerMetriques(predictions: Prediction[]): Metriques {
  return {
    precision: compter(predictions, predit, attendu),
    rappelArnaques: compter(predictions, attendu, predit),
    rappelVariantesInedites: compter(predictions, deCategorie("variante_inedite"), predit),
    faussesAlertesLegitimesDifficiles: compter(predictions, deCategorie("legitime_difficile"), predit),
    injectionsDetectees: compter(predictions, deCategorie("injection"), predit),
  };
}

export const formaterCompte = ({ ok, total }: Compte): string =>
  total === 0 ? "n/a" : `${ok} sur ${total}`;
