/**
 * Source unique de vérité pour les marqueurs de masquage des données sensibles.
 * Convention du projet : formes en majuscules sans accent (ex: [NUMERO_MASQUE]).
 */
export const MARQUEURS = {
  numero: "[NUMERO_MASQUE]",
  montant: "[MONTANT_MASQUE]",
  lien: "[LIEN_MASQUE]",
  code: "[CODE_MASQUE]",
  nom: "[NOM_MASQUE]",
} as const;

export type Marqueur = (typeof MARQUEURS)[keyof typeof MARQUEURS];

/**
 * Mots contenus dans les marqueurs pour éviter que le masquage des noms
 * (lib/noms.ts) ne les prenne pour des noms propres.
 */
export const MOTS_DES_MARQUEURS = [
  "NUMERO",
  "MONTANT",
  "LIEN",
  "CODE",
  "NOM",
  "MASQUE",
  "Masqué",
  "Masque",
  "Numero",
  "Numéro",
] as const;

