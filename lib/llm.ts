import { z } from "zod";

/**
 * Schéma Zod pour valider strictement la sortie produite par le modèle de langage.
 * Règle stricte : le niveau doit être « danger », « suspect » ou « aucun_signal » (jamais le terme « sûr »).
 */
export const llmOutputSchema = z.object({
  niveau: z.enum(["danger", "suspect", "aucun_signal"]),
  signaux: z.array(z.string()).min(1).max(3),
  explication: z.string().max(400), // ~60 mots maximum
  conduite_id: z.string().min(1),
});

export type LLMOutput = z.infer<typeof llmOutputSchema>;

/**
 * Cache mémoire pour stocker les analyses LLM.
 * Clé de cache = version du prompt + message.
 */
const cacheAnalyses = new Map<string, LLMOutput>();

/**
 * Construit la clé de cache unique.
 * Clé = version du prompt + message
 */
export function buildCacheKey(promptVersion: string, message: string): string {
  return `${promptVersion}:::${message}`;
}

/**
 * Analyse un message masqué à l'aide d'un LLM avec mise en cache des réponses.
 * La réponse est systématiquement validée par le schéma Zod.
 * 
 * @param message Message masqué à évaluer
 * @param promptVersion Version du prompt utilisée (défaut : v0.1.0)
 * @returns Promesse contenant la sortie validée par Zod
 */
export async function analyzeWithLLM(
  message: string,
  promptVersion: string = "v0.1.0"
): Promise<LLMOutput> {
  const cacheKey = buildCacheKey(promptVersion, message);

  // Vérification de la présence dans le cache
  const cached = cacheAnalyses.get(cacheKey);
  if (cached) {
    return cached;
  }

  // TODO: Préparer le prompt système et utilisateur selon la version spécifiée
  // TODO: Appeler l'API du fournisseur LLM configuré
  // TODO: Parser la réponse JSON du LLM

  // Sortie stub validée pour initialisation
  const stubOutput: LLMOutput = {
    niveau: "suspect",
    signaux: ["Suspicion générique (TODO)"],
    explication: "Explication générique en français simple de moins de 60 mots (TODO).",
    conduite_id: "conduite_suspicion_generale",
  };

  // Validation par le schéma Zod
  const resultatValide = llmOutputSchema.parse(stubOutput);

  // Sauvegarde dans le cache
  cacheAnalyses.set(cacheKey, resultatValide);

  return resultatValide;
}
