import { evaluateSystemA } from "../lib/rules";
import type { NiveauAlerte } from "../lib/types";

export interface Systeme {
  description: string;
  version: string;
  analyser: (texteMasque: string) => Promise<NiveauAlerte>;
}

export const SYSTEMES: Record<string, Systeme> = {
  A: {
    description: "règles et mots-clés",
    version: "regles",
    analyser: async (texte) => evaluateSystemA(texte).niveau,
  },
};
