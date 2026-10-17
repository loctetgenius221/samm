import type { ResultatRegles } from "./types";

/**
 * Module d'analyse heuristique basé sur des règles déterministes.
 */

/**
 * Analyse un texte préalablement masqué pour extraire les signaux d'alerte basés sur des règles
 * et déterminer si l'indicateur « plancher suspect » doit être activé.
 * 
 * @param texteMasque Texte à analyser (sans données sensibles non masquées)
 * @returns Structure contenant la liste des signaux identifiés et l'indicateur « plancher suspect »
 */
export function evaluateRules(texteMasque: string): ResultatRegles {
  void texteMasque;
  // TODO: Appliquer les règles déterministes :
  // - Détection de sentiments d'urgence injustifiés (ex: "immédiatement", "bloqué sous 2h")
  // - Détection de sollicitation d'informations confidentielles (code OTP, PIN, pièce d'identité)
  // - Détection d'usurpation d'identité d'opérateurs de mobile money
  // TODO: Définir si au moins une règle critique active le plancher suspect (plancher_suspect = true)

  return {
    signaux: [],
    plancher_suspect: false,
  };
}
