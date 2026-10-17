import { z } from "zod";

/**
 * Schéma Zod pour valider la configuration LLM à l'exécution.
 * Cette validation est exécutée à la demande lors des appels d'API et jamais lors du build Next.js.
 */
export const llmConfigSchema = z
  .object({
    LLM_PROVIDER: z.enum(["groq", "cerebras"], {
      message: "La variable LLM_PROVIDER doit être 'groq' ou 'cerebras'.",
    }).default("groq"),
    LLM_MODEL: z
      .string()
      .min(1, "La variable LLM_MODEL ne doit pas être vide.")
      .default("openai/gpt-oss-120b"),
    LLM_BASE_URL: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    CEREBRAS_API_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.LLM_PROVIDER === "groq" && (!data.GROQ_API_KEY || data.GROQ_API_KEY.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GROQ_API_KEY"],
        message: "La clé d'API GROQ_API_KEY est obligatoire lorsque LLM_PROVIDER='groq'.",
      });
    }
    if (data.LLM_PROVIDER === "cerebras" && (!data.CEREBRAS_API_KEY || data.CEREBRAS_API_KEY.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CEREBRAS_API_KEY"],
        message: "La clé d'API CEREBRAS_API_KEY est obligatoire lorsque LLM_PROVIDER='cerebras'.",
      });
    }
  });

export interface LLMConfig {
  provider: "groq" | "cerebras";
  model: string;
  baseUrl: string;
  apiKey: string;
}

/**
 * Lit et valide la configuration du LLM à partir des variables d'environnement.
 * Règle importante : cette fonction ne doit être appelée qu'à l'exécution de l'API, jamais à l'import ni au build.
 * 
 * @returns La configuration validée pour instancier le client OpenAI compatible
 * @throws Error avec un message clair en français si la configuration est invalide
 */
export function getLLMConfig(): LLMConfig {
  const result = llmConfigSchema.safeParse({
    LLM_PROVIDER: process.env.LLM_PROVIDER || "groq",
    LLM_MODEL: process.env.LLM_MODEL || "openai/gpt-oss-120b",
    LLM_BASE_URL: process.env.LLM_BASE_URL || undefined,
    GROQ_API_KEY: process.env.GROQ_API_KEY || undefined,
    CEREBRAS_API_KEY: process.env.CEREBRAS_API_KEY || undefined,
  });

  if (!result.success) {
    const errorDetails = result.error.issues.map((i) => i.message).join(" ");
    throw new Error(`Configuration LLM invalide : ${errorDetails}`);
  }

  const { LLM_PROVIDER, LLM_MODEL, LLM_BASE_URL, GROQ_API_KEY, CEREBRAS_API_KEY } = result.data;

  const defaultBaseUrls = {
    groq: "https://api.groq.com/openai/v1",
    cerebras: "https://api.cerebras.ai/v1",
  };

  const baseUrl = LLM_BASE_URL && LLM_BASE_URL.trim().length > 0 ? LLM_BASE_URL : defaultBaseUrls[LLM_PROVIDER];
  const apiKey = LLM_PROVIDER === "groq" ? GROQ_API_KEY! : CEREBRAS_API_KEY!;

  return {
    provider: LLM_PROVIDER,
    model: LLM_MODEL,
    baseUrl,
    apiKey,
  };
}
