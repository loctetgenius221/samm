/**
 * Types partagés pour l'application Sàmm.
 * Tous les types respectent strictement le contrat d'API et les spécifications du projet.
 */

/**
 * Source du contenu analysé.
 */
export type SourceAnalyse = "texte" | "capture";

/**
 * Niveau de risque détecté.
 * Règle stricte : Ne jamais utiliser le mot « sûr ».
 */
export type NiveauAlerte = "danger" | "suspect" | "aucun_signal";

/**
 * Représentation d'une arnaque similaire retournée avec son score de similarité.
 */
export interface ArnaqueProche {
  id: string;
  score: number;
  resume?: string;
  signaux?: string[];
}

/**
 * Contrat de la requête envoyée à l'API d'analyse (/api/analyse).
 * Le texte doit être préalablement masqué côté client.
 */
export interface AnalyseRequest {
  texte: string;
  source: SourceAnalyse;
}

/**
 * Contrat de la réponse réussie renvoyée par l'API d'analyse (/api/analyse).
 */
export interface AnalyseResponse {
  /** Niveau parmi « danger », « suspect » ou « aucun_signal » (jamais « sûr ») */
  niveau: NiveauAlerte;
  /** Liste de 1 à 3 signaux courts */
  signaux: string[];
  /** Explication en français simple de 60 mots maximum */
  explication: string;
  /** Identifiant de conduite qui doit exister dans conduite.yaml */
  conduite_id: string;
  /** Liste des arnaques proches avec leur score */
  arnaques_proches: ArnaqueProche[];
  /** Version du prompt utilisé pour l'analyse */
  version_prompt: string;
}

/**
 * Contrat d'erreur renvoyé par l'API d'analyse.
 * En cas d'erreur HTTP, le client doit afficher « suspect » par défaut.
 */
export interface AnalyseErrorResponse {
  error: string;
  message: string;
}

/**
 * Structure d'un contact officiel associé à une conduite à tenir.
 * Note : Ne pas inventer de numéro ou d'URL réels (TODO explicite si non renseigné).
 */
export interface ContactConduite {
  type: string;
  valeur: string;
  source: string;
  date_source: string;
  a_verifier: boolean;
}

/**
 * Structure d'une entrée de conduite à tenir (définie dans conduite.yaml).
 */
export interface ConduiteEntree {
  id: string;
  texte: string;
  contacts: ContactConduite[];
}

/**
 * Structure d'une entrée de la base d'arnaques (dossier scams/).
 */
export interface ScamEntree {
  id: string;
  operateur: string;
  langue: string;
  canal: string;
  niveau: NiveauAlerte;
  resume: string;
  exemple_masque: string;
  signaux: string[];
  conduite_id: string;
  source: string;
  date_source: string;
}

/**
 * Signal faible ou fort retourné par le moteur de règles heuristiques.
 */
export interface SignalRegle {
  code: string;
  description: string;
  poids?: number;
}

/**
 * Résultat de l'analyse par règles heuristiques.
 */
export interface ResultatRegles {
  signaux: SignalRegle[];
  plancher_suspect: boolean;
}
