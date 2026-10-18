import type { ResultatRegles, SignalRegle } from "./types";

/**
 * Interface pour la déclaration d'une règle heuristique déterministe.
 * Conçue pour être facilement enrichie par la communauté via des pull requests.
 */
export interface RegleDefinition {
  /** Identifiant unique de la règle (ex: regle_demande_code) */
  id: string;
  /** Libellé court en français affiché comme signal d'alerte */
  signal: string;
  /**
   * Indique si la règle est « dure » : si elle se déclenche,
   * l'indicateur « plancher suspect » devient immédiatement vrai.
   */
  dure: boolean;
  /** Description détaillée de la fraude ou de la menace ciblée */
  description: string;
  /**
   * Fonction de test exécutée sur le texte normalisé (et brut si besoin).
   * Retourne true si la règle se déclenche.
   */
  tester: (texteNormalise: string, texteBrut: string) => boolean;
}

// ---------------------------------------------------------------------------
// Normalisation du texte avant analyse
// ---------------------------------------------------------------------------

/**
 * Détecte et fusionne les séquences de lettres isolées séparées par des espaces (« c o d e » -> « code »).
 * Préserve les mots normaux et évite de fusionner des mots distincts.
 */
export function collapseSpacedLetters(text: string): string {
  // Séquences de lettres/chiffres isolés séparés par un espace simple.
  // Exemple : "c o d e" -> "code", "p i n" -> "pin", "w a v e" -> "wave".
  // On exclut les lettres suivies d'une apostrophe (élisions françaises comme s'il, l'ami, d'urgence, c'est).
  // On ignore également la séquence spécifique "y a" qui correspond à l'expression courante en français ("il y a").
  return text.replace(
    /(?<=(?:^|[^a-z0-9]))([a-z0-9](?!['’]))(?: ([a-z0-9](?!['’])))+(?=(?:[^a-z0-9]|$))/gi,
    (match) => {
      if (match.toLowerCase() === "y a") {
        return match;
      }
      return match.replace(/ /g, "");
    }
  );
}

/**
 * Normalise un texte brut avant évaluation des règles déterministes :
 * 1. Forme canonique Unicode NFKC (compatibilité & décomposition/recomposition).
 * 2. Suppression des caractères invisibles (espaces de largeur nulle, marques de direction, soft hyphens).
 * 3. Réduction des espaces multiples (espaces, tabulations, retours à la ligne).
 * 4. Conversion en minuscules.
 * 5. Gestion et fusion des lettres espacées (« c o d e » -> « code »).
 *
 * @param text Texte à normaliser
 * @returns Texte nettoyé et normalisé
 */
export function normalizeText(text: string): string {
  if (!text) return "";

  // 1. Forme canonique Unicode NFKC
  let normalized = text.normalize("NFKC");

  // 2. Suppression des caractères invisibles et de contrôle
  // \u200B-\u200D (zero-width space/joiner), \uFEFF (BOM), \u00AD (soft hyphen)
  // \u200E-\u200F (marques LTR/RTL), \u202A-\u202E (embeddings directionnels)
  // \u2060-\u206F (caractères invisibles de formatage)
  normalized = normalized.replace(
    /[\u200B-\u200D\uFEFF\u00AD\u200E\u200F\u202A-\u202E\u2060-\u206F]/g,
    ""
  );
  // Suppression des caractères de contrôle ASCII non imprimables
  normalized = normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 3. Minuscules
  normalized = normalized.toLowerCase();

  // 4. Gestion des lettres espacées avant réduction complète des espaces multiples
  // (permet de préserver la frontière entre deux mots eux-mêmes espacés séparés par plusieurs espaces)
  normalized = collapseSpacedLetters(normalized);

  // 5. Réduction des espaces multiples en un espace simple
  normalized = normalized.replace(/\s+/g, " ").trim();

  // Deuxième passage pour d'éventuelles lettres espacées restantes après réduction d'espaces
  normalized = collapseSpacedLetters(normalized);

  return normalized;
}

// ---------------------------------------------------------------------------
// Liste déclarative des règles de garde-fou (système A)
// ---------------------------------------------------------------------------

export const REGLES_DETERMINISTES: RegleDefinition[] = [
  // 1. Demande de communiquer ou renvoyer un code reçu par SMS ou code secret
  {
    id: "regle_demande_code",
    signal: "Demande de transmission d'un code secret ou reçu par SMS",
    dure: true,
    description:
      "Détecte les sollicitations demandant de renvoyer, communiquer ou confirmer un code secret, code OTP ou mot de passe.",
    tester: (texte: string): boolean => {
      // Exclure les messages d'avertissement officiels disant explicitement de ne JAMAIS partager son code
      const avertissementOfficiel =
        /ne\s+(?:le\s+)?(?:partagez|donnez|communiquez|transmettez)\s+(?:jamais|pas)/i.test(
          texte
        );
      const conseilSecuriteWave =
        /(?:wave|orange)\s+ne\s+vous\s+demandera\s+jamais\s+votre\s+code/i.test(
          texte
        );

      if (avertissementOfficiel || conseilSecuriteWave) {
        // Si c'est un avertissement légitime sans contre-demande malveillante, on ne déclenche pas
        const contientDemandeMalveillante =
          /(?:veuillez|merci de|donne|envoie|renvoie|composez)\s+.*(?:code|otp|pin|secret)/i.test(
            texte
          );
        if (!contientDemandeMalveillante) {
          return false;
        }
      }

      // Combinaison : Verbe d'action/transmission + Cible confidentielle
      const actionTransmission =
        /(?:renvoy(?:ez|er|e)|envoy(?:ez|er|e)|donn(?:ez|er|e)|partag(?:ez|er|e)|communiqu(?:ez|er|e)|transmett(?:ez|re)|transmet|fourni(?:ssez|r)|saisiss(?:ez|ir)|confirm(?:ez|er)|recopi(?:ez|er)|transf[eé]r(?:ez|er)|tap(?:ez|er)|r[eé]pondez avec|sms au)/i;
      const cibleCode =
        /(?:code|otp|pin|secret|confidentiel|mot de passe|motdepasse|identifiant)/i;

      const motifComposezCode =
        /composez\s+(?:le\s+)?(?:#|\*)\d+.*(?:code|secret|pin)/i;
      const motifRenvoyezCodeRecu =
        /(?:renvoyez|donnez|envoyez|transmettez)\s+.*(?:code\s+re[cç]u|que\s+vous\s+venez\s+de\s+recevoir)/i;
      const motifConfirmezCode =
        /confirm(?:ez|er)\s+(?:votre\s+)?code\s+(?:secret|otp|pin)/i;

      return (
        motifComposezCode.test(texte) ||
        motifRenvoyezCodeRecu.test(texte) ||
        motifConfirmezCode.test(texte) ||
        (actionTransmission.test(texte) && cibleCode.test(texte))
      );
    },
  },

  // 2. Urgence avec délai (ex: sous 48 heures, immédiatement)
  {
    id: "regle_urgence_delai",
    signal: "Pression temporelle avec menace de blocage ou délai strict",
    dure: true,
    description:
      "Détecte la combinaison d'une menace de suspension/blocage et d'un délai temporel strict destiné à paniquer l'utilisateur.",
    tester: (texte: string): boolean => {
      const menaceBlocage =
        /(?:bloqu[eé]|bloquer|blocage|suspendu|suspendre|suspension|fermeture|ferm[eé]|expir(?:e|er|ation)|r[eé]sili[eé]|r[eé]silier|d[eé]sactiv[eé]|d[eé]sactiver|supprim[eé]|supprimer|p[eé]nalit[eé]|poursuites?|sanction)/i;
      const delaiStrict =
        /(?:sous\s+\d+\s*(?:h|heure|heures|j|jour|jours)|dans\s+\d+\s*(?:h|heure|heures|j|jour|jours)|d[eé]lai\s+de\s+\d+|avant\s+(?:ce\s+soir|minuit)|imm[eé]diatement|sans\s+d[eé]lai|dans\s+les\s+plus\s+brefs\s+d[eé]lais|tr[eè]s\s+urgent|en\s+urgence|dernier\s+d[eé]lai)/i;

      return menaceBlocage.test(texte) && delaiStrict.test(texte);
    },
  },

  // 3. Lien dans un message usurpant un opérateur ou une administration
  {
    id: "regle_lien_usurpation",
    signal: "Lien suspect associé à un opérateur ou un service public",
    dure: true,
    description:
      "Détecte la présence d'un lien web ou d'une invitation à cliquer combinée à la mention d'un opérateur ou d'une autorité.",
    tester: (texte: string): boolean => {
      const usurpationEntite =
        /(?:wave|orange|orange money|free|free money|sensuivi|wizall|wari|postecache|artp|police|gendarmerie|justice|tribunal|tr[eé]sor|imp[oô]ts|douane|dgid|gouvernement|minist[eè]re)/i;
      const presenceLien =
        /(?:https?:\/\/|www\.|\[lien_masque\]|\[url_masque\]|t\.co|bit\.ly|\.link\b|\.top\b|\.xyz\b|\.ml\b|\.ga\b|\.cf\b|\.tk\b|cliqu(?:ez|er)|connectez[- ]vous sur|rendez[- ]vous sur|suivez le lien)/i;

      return usurpationEntite.test(texte) && presenceLien.test(texte);
    },
  },

  // 4. Demande de dépôt ou d'envoi d'argent
  {
    id: "regle_demande_argent",
    signal: "Demande d'envoi ou de dépôt d'argent pour déblocage ou frais",
    dure: true,
    description:
      "Détecte une demande d'effectuer un dépôt ou transfert d'argent (frais de dossier, caution, déblocage de solde).",
    tester: (texte: string): boolean => {
      // Exclure les simples notifications de réception de transfert (ex: "Vous avez reçu 5000 FCFA")
      const notificationReception =
        /^vous\s+avez\s+re[cç]u\s+/i.test(texte) &&
        !/(?:veuillez|merci de|renvoyer|d[eé]poser|envoyer)\s+/i.test(texte);
      if (notificationReception) {
        return false;
      }

      const verbeEnvoi =
        /(?:d[eé]pos(?:ez|er|e)|envoy(?:ez|er|e)|transf[eé]r(?:ez|er|e)|vers(?:ez|er|e)|pay(?:ez|er|e)|r[eé]charg(?:ez|er|e)|fais\s+un\s+d[eé]p[oô]t|faire\s+un\s+d[eé]p[oô]t)/i;
      const objetFinancier =
        /(?:argent|frais|caution|avance|commission|somme|fonds|solde|\[montant_masque\]|\d+\s*(?:fcfa|cfa|f\b)|sur le num[eé]ro|au num[eé]ro|vers le compte)/i;
      const justification =
        /(?:pour\s+(?:d[eé]bloquer|valider|recevoir|activer|r[eé]cup[eé]rer)|frais\s+de|caution\s+de|avance\s+de)/i;

      // Condition A : Verbe d'envoi + objet financier + justification
      const conditionComplete =
        verbeEnvoi.test(texte) &&
        objetFinancier.test(texte) &&
        justification.test(texte);

      // Condition B : Demande explicite directe d'envoyer de l'argent/frais
      const conditionDirecte =
        /(?:d[eé]pos(?:ez|er)|envoy(?:ez|er)|transf[eé]r(?:ez|er))\s+(?:la\s+somme|l'argent|les\s+frais|\d+\s*(?:fcfa|cfa|f\b)|\[montant_masque\])/i.test(
          texte
        );

      return conditionComplete || conditionDirecte;
    },
  },

  // 5. Faux transfert « envoyé par erreur »
  {
    id: "regle_faux_transfert_erreur",
    signal: "Prétendu transfert d'argent envoyé par erreur demandant un remboursement",
    dure: true,
    description:
      "Détecte le scénario d'arnaque classique où l'escroc affirme s'être trompé de numéro et sollicite le renvoi des fonds.",
    tester: (texte: string): boolean => {
      const notionErreur =
        /(?:erreur|tromp[eé]|tromp[eé]e|inadvertance|par accident|fausse manip(?:ulation)?)/i;
      const notionRemboursement =
        /(?:renvoy(?:ez|er|e)|rembours(?:ez|er|e)|retourn(?:ez|er|e)|restitu(?:ez|er|e)|renvoi|remboursement|retransf[eé]r(?:ez|er|e)|faire retour|rappelez[- ]moi)/i;

      return notionErreur.test(texte) && notionRemboursement.test(texte);
    },
  },

  // 6. Demande d'installer une application
  {
    id: "regle_installation_application",
    signal: "Incitation à télécharger ou installer une application externe",
    dure: true,
    description:
      "Détecte les incitations à installer un fichier APK ou une application tierce (notamment de contrôle à distance).",
    tester: (texte: string): boolean => {
      const actionInstallation =
        /(?:install(?:ez|er|e)|t[eé]l[eé]charg(?:ez|er|e)|t[eé]l[eé]chargement|mettez [aà] jour|mettre [aà] jour)/i;
      const cibleApplication =
        /(?:application|appli|apk\b|logiciel|lien d'installation|anydesk|teamviewer|rustdesk|quicksupport)/i;

      return actionInstallation.test(texte) && cibleApplication.test(texte);
    },
  },

  // 7. Prétention d'être agent d'opérateur, de la police ou du Trésor
  {
    id: "regle_usurpation_agent",
    signal: "Usurpation de fonction (agent d'opérateur, police ou Trésor public)",
    dure: true,
    description:
      "Détecte la prétention d'agir en tant qu'agent officiel d'un opérateur, policier ou représentant de l'administration publique.",
    tester: (texte: string): boolean => {
      const fonctionAgent =
        /(?:agent|conseiller|technicien|charg[eé] de client[eè]le|service client(?:[eè]le)?|support technique|service fraude|direction|administrateur|brigade|inspecteur|officier|policier|lieutenant|commandant|gendarme|huissier)/i;
      const organismePublicOuOperateur =
        /(?:wave|orange|orange money|free|free money|t[eé]l[eé]com|police|gendarmerie|tribunal|justice|tr[eé]sor|dgid|minist[eè]re|douane|artp)/i;

      const motifPretentionDirecte =
        /(?:(?:je\s+suis|ici\s+le)\s+.*(?:agent|conseiller|service\s+client|police|tr[eé]sor)|de\s+la\s+part\s+de\s+la\s+(?:police|gendarmerie|brigade))/i;

      return (
        motifPretentionDirecte.test(texte) ||
        (fonctionAgent.test(texte) && organismePublicOuOperateur.test(texte))
      );
    },
  },

  // 8. Gain ou cadeau inattendu
  {
    id: "regle_gain_inattendu",
    signal: "Promesse de gain, loterie ou cadeau inattendu avec réclamation",
    dure: true,
    description:
      "Détecte les notifications de gains fictifs, tombolas ou tirages au sort conditionnés à une prise de contact ou réclamation.",
    tester: (texte: string): boolean => {
      const notionGain =
        /(?:f[eé]licitations?|vous avez gagn[eé]|heureux gagnant|lot\b|tirage au sort|loterie|tombola|cadeau|bonus exceptionnel|subvention|b[eé]n[eé]ficiaire s[eé]lectionn[eé])/i;
      const notionReclamation =
        /(?:pour r[eé]clamer|pour recevoir|pour d[eé]bloquer|cliqu(?:ez|er)|appelez|contactez|envoyez vos coordonn[eé]es|r[eé]clamez votre lot|r[eé]cup[eé]r(?:er|ez) votre gain)/i;

      return notionGain.test(texte) && notionReclamation.test(texte);
    },
  },
];

// ---------------------------------------------------------------------------
// Fonction principale d'évaluation
// ---------------------------------------------------------------------------

/**
 * Analyse un texte préalablement masqué pour extraire les signaux d'alerte basés sur des règles
 * déterministes et déterminer si l'indicateur « plancher suspect » doit être activé.
 *
 * @param texteMasque Texte à analyser (sans données sensibles non masquées)
 * @returns Structure contenant la liste des signaux identifiés et l'indicateur « plancher suspect »
 */
export function evaluateRules(texteMasque: string): ResultatRegles {
  if (!texteMasque || typeof texteMasque !== "string" || texteMasque.trim().length === 0) {
    return {
      signaux: [],
      plancher_suspect: false,
    };
  }

  const texteNormalise = normalizeText(texteMasque);
  const signauxDetectes: SignalRegle[] = [];
  let plancherSuspect = false;

  for (const regle of REGLES_DETERMINISTES) {
    if (regle.tester(texteNormalise, texteMasque)) {
      signauxDetectes.push({
        code: regle.id,
        description: regle.signal,
        poids: regle.dure ? 1.0 : 0.5,
      });

      if (regle.dure) {
        plancherSuspect = true;
      }
    }
  }

  return {
    signaux: signauxDetectes,
    plancher_suspect: plancherSuspect,
  };
}

// ---------------------------------------------------------------------------
// Export pour le système A (évaluation règles seules)
// ---------------------------------------------------------------------------

export interface ResultatSystemA {
  niveau: "danger" | "suspect" | "aucun_signal";
  signaux: string[];
  plancher_suspect: boolean;
  regles_declenchees: string[];
}

/**
 * Exécute l'analyse du Système A (règles seules) pour le banc d'évaluation.
 * Si le plancher suspect est activé, renvoie « suspect », sinon « aucun_signal ».
 *
 * @param texteMasque Texte masqué à évaluer
 * @returns Résultat d'analyse selon le Système A
 */
export function evaluateSystemA(texteMasque: string): ResultatSystemA {
  const { signaux, plancher_suspect } = evaluateRules(texteMasque);

  return {
    niveau: plancher_suspect ? "suspect" : "aucun_signal",
    signaux: signaux.map((s) => s.description),
    plancher_suspect,
    regles_declenchees: signaux.map((s) => s.code),
  };
}
