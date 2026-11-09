import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { ConduiteEntree, ContactConduite } from "./types";

/**
 * Référentiel des conduites à tenir de secours par défaut.
 */
export const CONDUITES_PAR_DEFAUT: Record<string, string> = {
  conduite_suspicion_generale:
    "Ne communiquez aucun code secret ni identifiant personnel. En cas de doute, contactez le service client officiel de votre opérateur mobile money.",
  conduite_compte_compromis:
    "Si vous avez partagé des informations confidentielles, faites immédiatement bloquer votre compte auprès de votre opérateur et modifiez votre code secret.",
};

export const CONDUITE_GENERIQUE_ID = "conduite_suspicion_generale";

let cachedConduites: Map<string, ConduiteEntree> | null = null;

/**
 * Lit et met en cache en mémoire la liste des conduites définies dans conduite.yaml.
 */
export function getConduitesMap(): Map<string, ConduiteEntree> {
  if (cachedConduites) {
    return cachedConduites;
  }

  const map = new Map<string, ConduiteEntree>();
  try {
    const filePath = path.join(process.cwd(), "conduite.yaml");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = yaml.parse(raw) as ConduiteEntree[];
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          if (c && c.id) {
            map.set(c.id, {
              id: c.id,
              texte: c.texte || "",
              contacts: Array.isArray(c.contacts) ? c.contacts : [],
            });
          }
        }
      }
    }
  } catch {
    // Si la lecture échoue, les conduites par défaut s'appliquent
  }

  cachedConduites = map;
  return map;
}

/**
 * Retourne la liste de tous les identifiants de conduite existants dans conduite.yaml.
 */
export function getAllConduiteIds(): string[] {
  const map = getConduitesMap();
  const ids = Array.from(map.keys());
  return ids.length > 0 ? ids : Object.keys(CONDUITES_PAR_DEFAUT);
}

/**
 * Structure de la conduite résolue et nettoyée pour l'affichage client.
 */
export interface ConduiteResolue {
  id: string;
  texte: string;
  contacts: ContactConduite[];
}

/**
 * Résout une conduite par son identifiant :
 * - Si le conduite_id existe, l'utilise.
 * - S'il n'existe pas, bascule sur la conduite générique.
 * - Filtre strictement les contacts pour ne conserver QUE ceux dont `a_verifier === false`.
 *
 * @param conduiteId Identifiant de la conduite suggérée
 * @returns Conduite résolue avec texte et contacts vérifiés
 */
export function getResolvedConduite(conduiteId: string): ConduiteResolue {
  const map = getConduitesMap();
  let target = map.get(conduiteId);

  // Bascule sur la conduite générique si l'identifiant est inconnu
  if (!target) {
    target = map.get(CONDUITE_GENERIQUE_ID);
  }

  if (!target) {
    return {
      id: CONDUITE_GENERIQUE_ID,
      texte:
        CONDUITES_PAR_DEFAUT[CONDUITE_GENERIQUE_ID] ||
        "Ne communiquez aucun code secret ni identifiant personnel. En cas de doute, contactez le service client officiel de votre opérateur mobile money.",
      contacts: [],
    };
  }

  // Règle stricte : Ne renvoyer QUE les contacts dont a_verifier est faux
  const contactsVerifies = (target.contacts || []).filter(
    (c) => c.a_verifier === false
  );

  return {
    id: target.id,
    texte: target.texte,
    contacts: contactsVerifies,
  };
}

/**
 * Récupère le texte de conduite à tenir associé à un identifiant.
 *
 * @param conduiteId Identifiant de la conduite
 * @returns Le texte explicatif de la conduite à tenir
 */
export function getTexteConduite(conduiteId: string): string {
  const resolved = getResolvedConduite(conduiteId);
  return resolved.texte;
}
