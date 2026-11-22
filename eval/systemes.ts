import { analyser as analyserMessage } from "../lib/analyse";
import { getLLMConfig } from "../lib/config";
import { VERSION_PROMPT } from "../lib/llm";
import { evaluateSystemA } from "../lib/rules";
import type { NiveauAlerte } from "../lib/types";

export interface Systeme {
  description: string;
  version: () => string;
  analyser: (texteMasque: string) => Promise<NiveauAlerte>;
}

// Lève une erreur claire sans clé d'API : le repli « suspect » fausserait la mesure.
const versionModele = () => `${VERSION_PROMPT} ${getLLMConfig().model}`;

export const SYSTEMES: Record<string, Systeme> = {
  A: {
    description: "règles et mots-clés",
    version: () => "regles",
    analyser: async (texte) => evaluateSystemA(texte).niveau,
  },
  B: {
    description: "règles, recherche et modèle",
    version: versionModele,
    analyser: async (texte) => (await analyserMessage(texte)).niveau,
  },
  C: {
    description: "modèle seul",
    version: versionModele,
    analyser: async (texte) => (await analyserMessage(texte, { regles: false, recherche: false })).niveau,
  },
};
