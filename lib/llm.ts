import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import OpenAI from "openai";
import type { LLMConfig } from "@/lib/config";
import { getLLMConfig, getFallbackConfig, isDiskCacheEnabled } from "@/lib/config";
import { buildSystemPrompt, buildUserMessage, VERSION_PROMPT } from "@/lib/prompt";
import type { SignalRegle, ArnaqueProche } from "@/lib/types";

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
 * Schéma JSON compatible avec le format response_format de l'API OpenAI (json_schema strict).
 */
const JSON_SCHEMA_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "analyse_arnaque",
    strict: true,
    schema: {
      type: "object",
      properties: {
        niveau: { type: "string", enum: ["danger", "suspect", "aucun_signal"] },
        signaux: {
          type: "array",
          items: { type: "string" },
          minItems: 1,
          maxItems: 3,
        },
        explication: { type: "string" },
        conduite_id: { type: "string" },
      },
      required: ["niveau", "signaux", "explication", "conduite_id"],
      additionalProperties: false,
    },
  },
};

// ---------------------------------------------------------------------------
// Cache mémoire (clé = version du prompt + texte masqué)
// ---------------------------------------------------------------------------
const cacheMemoire = new Map<string, LLMOutput>();

/**
 * Construit la clé de cache unique.
 */
export function buildCacheKey(promptVersion: string, message: string): string {
  return `${promptVersion}:::${message}`;
}

/**
 * Construit un nom de fichier de cache disque sécurisé à partir de la clé.
 */
function diskCachePath(cacheKey: string): string {
  const hash = crypto.createHash("sha256").update(cacheKey).digest("hex");
  return path.join(process.cwd(), "eval", "cache", `${hash}.json`);
}

/**
 * Lit le cache disque si activé.
 */
function readDiskCache(cacheKey: string): LLMOutput | null {
  if (!isDiskCacheEnabled()) return null;
  const filePath = diskCachePath(cacheKey);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return llmOutputSchema.parse(JSON.parse(raw));
    }
  } catch {
    // Fichier corrompu ou invalide : on ignore silencieusement
  }
  return null;
}

/**
 * Écrit dans le cache disque si activé.
 */
function writeDiskCache(cacheKey: string, output: LLMOutput): void {
  if (!isDiskCacheEnabled()) return;
  const filePath = diskCachePath(cacheKey);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(output, null, 2), "utf-8");
  } catch {
    // Échec d'écriture disque non critique : on continue sans cache disque
  }
}

// ---------------------------------------------------------------------------
// Client LLM
// ---------------------------------------------------------------------------

/**
 * Crée un client OpenAI compatible pour une configuration donnée.
 */
function createClient(config: LLMConfig): OpenAI {
  return new OpenAI({
    baseURL: config.baseUrl,
    apiKey: config.apiKey,
    timeout: 15_000,
    maxRetries: 0, // On gère les relances manuellement
  });
}

/**
 * Détermine si l'erreur est une erreur récupérable (429 ou 5xx).
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || (error.status !== undefined && error.status >= 500);
  }
  return false;
}

/**
 * Petite pause exponentielle.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Appel LLM avec relance et bascule
// ---------------------------------------------------------------------------

/**
 * Effectue l'appel au modèle et retourne le contenu brut de la réponse.
 * IMPORTANT : Ne journalise jamais le texte des messages.
 */
async function callLLM(
  config: LLMConfig,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const client = createClient(config);

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: JSON_SCHEMA_RESPONSE_FORMAT,
    reasoning_effort: "low",
    temperature: 0.15,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Le modèle n'a retourné aucun contenu.");
  }
  return content;
}

/**
 * Stratégie d'appel :
 * 1. Tenter le fournisseur principal
 * 2. En cas d'erreur 429/5xx : attendre 1,5 s puis relancer une fois
 * 3. Si la relance échoue : basculer sur le fournisseur de secours (s'il est configuré)
 * 4. Si tout échoue : lever une erreur propre
 */
async function callWithRetryAndFallback(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const primaryConfig = getLLMConfig();

  // Tentative 1 : fournisseur principal
  try {
    return await callLLM(primaryConfig, systemPrompt, userMessage);
  } catch (error) {
    if (!isRetryableError(error)) {
      throw error;
    }
    // Erreur récupérable : on attend avant de relancer
  }

  // Tentative 2 : relance après pause
  await sleep(1500);
  try {
    return await callLLM(primaryConfig, systemPrompt, userMessage);
  } catch (error) {
    if (!isRetryableError(error)) {
      throw error;
    }
    // La relance a aussi échoué : on tente le fournisseur de secours
  }

  // Tentative 3 : fournisseur de secours
  const fallbackConfig = getFallbackConfig();
  if (!fallbackConfig) {
    throw new Error(
      "Le fournisseur principal est indisponible et aucun fournisseur de secours n'est configuré."
    );
  }

  return await callLLM(fallbackConfig, systemPrompt, userMessage);
}

// ---------------------------------------------------------------------------
// Sortie par défaut en cas d'échec de validation
// ---------------------------------------------------------------------------
const FALLBACK_OUTPUT: LLMOutput = {
  niveau: "suspect",
  signaux: ["Analyse automatique non concluante"],
  explication:
    "L'analyse n'a pas pu produire un résultat fiable. Par précaution, ce message est considéré comme suspect. Contactez votre opérateur via son canal officiel.",
  conduite_id: "conduite_suspicion_generale",
};

// ---------------------------------------------------------------------------
// Point d'entrée public
// ---------------------------------------------------------------------------

/**
 * Analyse un message masqué à l'aide d'un LLM avec :
 * - Cache mémoire (et disque optionnel pour l'évaluation)
 * - Validation Zod stricte de la sortie
 * - Relance et bascule de fournisseur sur erreur 429/5xx
 *
 * IMPORTANT : Le texte des messages n'est JAMAIS journalisé.
 *
 * @param texteMasque Message préalablement anonymisé
 * @param signauxRegles Signaux identifiés par le moteur de règles
 * @param arnaquesProches Arnaques similaires trouvées dans le corpus
 * @returns Promesse contenant la sortie validée par Zod
 */
export async function analyzeWithLLM(
  texteMasque: string,
  signauxRegles: SignalRegle[] = [],
  arnaquesProches: ArnaqueProche[] = []
): Promise<LLMOutput> {
  const cacheKey = buildCacheKey(VERSION_PROMPT, texteMasque);

  // 1. Vérification du cache mémoire
  const cached = cacheMemoire.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Vérification du cache disque (si activé)
  const diskCached = readDiskCache(cacheKey);
  if (diskCached) {
    cacheMemoire.set(cacheKey, diskCached);
    return diskCached;
  }

  // 3. Construction des messages
  const systemPrompt = buildSystemPrompt(signauxRegles, arnaquesProches);
  const userMessage = buildUserMessage(texteMasque);

  // 4. Appel au modèle avec relance et bascule
  let rawContent: string;
  try {
    rawContent = await callWithRetryAndFallback(systemPrompt, userMessage);
  } catch {
    // Échec total de l'appel : retour d'une sortie par défaut
    return FALLBACK_OUTPUT;
  }

  // 5. Validation Zod — premier essai
  try {
    const parsed = JSON.parse(rawContent);
    const validated = llmOutputSchema.parse(parsed);
    cacheMemoire.set(cacheKey, validated);
    writeDiskCache(cacheKey, validated);
    return validated;
  } catch {
    // Première validation échouée : on retente l'appel
  }

  // 6. Second appel + validation
  try {
    const retryContent = await callWithRetryAndFallback(systemPrompt, userMessage);
    const parsed = JSON.parse(retryContent);
    const validated = llmOutputSchema.parse(parsed);
    cacheMemoire.set(cacheKey, validated);
    writeDiskCache(cacheKey, validated);
    return validated;
  } catch {
    // Deuxième validation échouée : retour de la sortie par défaut
    return FALLBACK_OUTPUT;
  }
}

/**
 * Réexporte la version du prompt pour l'usage dans le route handler.
 */
export { VERSION_PROMPT } from "@/lib/prompt";
