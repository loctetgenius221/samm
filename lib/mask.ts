/**
 * Module d'anonymisation et de protection de la vie privée.
 * Masque au mieux les données sensibles : numéros de téléphone, montants financiers, liens et codes.
 * Règle du projet : « masquage au mieux, non garanti ».
 */

/**
 * Options de configuration du masquage de texte.
 */
export interface MaskOptions {
  placeholderNumero?: string;
  placeholderMontant?: string;
  placeholderLien?: string;
  placeholderCode?: string;
  placeholderNom?: string;
}

const DEFAULT_OPTIONS: Required<MaskOptions> = {
  placeholderNumero: "[NUMERO_MASQUE]",
  placeholderMontant: "[MONTANT_MASQUE]",
  placeholderLien: "[LIEN_MASQUE]",
  placeholderCode: "[CODE_MASQUE]",
  placeholderNom: "[NOM_MASQUE]",
};

/**
 * Masque au mieux les numéros de téléphone, montants, liens et codes identifiables dans le texte.
 *
 * @param texte Le texte brut issu de l'OCR ou de la saisie utilisateur
 * @param options Options facultatives pour le remplacement des données
 * @returns Le texte anonymisé avec les entités sensibles masquées
 */
export function maskText(texte: string, options?: MaskOptions): string {
  if (!texte || typeof texte !== "string") {
    return "";
  }

  const opt = { ...DEFAULT_OPTIONS, ...options };
  let masque = texte;

  // 1. Masquage des URLs et liens web
  masque = masque.replace(
    /(?:https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:link|top|xyz|ga|cf|ml|tk|site|online)\b[^\s]*)/gi,
    opt.placeholderLien
  );

  // 2. Masquage des numéros de téléphone (formats sénégalais +221, 70/75/76/77/78/33 et internationaux)
  masque = masque.replace(
    /(?:\+?221\s*)?(?:7[05678]|33)(?:[\s.-]*\d{2,3}){3}\b/g,
    opt.placeholderNumero
  );
  masque = masque.replace(
    /(?:\+|00)\d{1,3}(?:[\s.-]*\d{2,4}){3,4}\b/g,
    opt.placeholderNumero
  );

  // 3. Masquage des montants financiers (FCFA, CFA, F, etc.)
  masque = masque.replace(
    /\b\d+(?:[\s.,]\d+)*\s*(?:fcfa|cfa|f\b|francs?\b|euros?|dollars?|\$|€)/gi,
    opt.placeholderMontant
  );

  // 4. Masquage des codes OTP / PIN numériques (4 à 8 chiffres précédés d'indicateurs de code)
  masque = masque.replace(
    /((?:code|otp|pin|secret|mot\s*de\s*passe|passe)\s*(?:est|:|=|\s)\s*)(\b\d{4,8}\b)/gi,
    `$1${opt.placeholderCode}`
  );

  // 5. Masquage des noms propres identifiés après des préfixes d'expédition / réception
  masque = masque.replace(
    /((?:de\s+la\s+part\s+de|envoy[eé]\s+par|re[cç]u\s+de)\s+)([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+)+)/g,
    `$1${opt.placeholderNom}`
  );

  return masque;
}
