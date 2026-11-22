import type { AnalyseResponse, ArnaqueProche, NiveauAlerte, ResultatRegles } from "@/lib/types";
import { evaluateRules } from "@/lib/rules";
import { retrieveSimilarScams } from "@/lib/retrieve";
import { analyzeWithLLM, VERSION_PROMPT } from "@/lib/llm";
import { getAllConduiteIds, getResolvedConduite } from "@/lib/conduite";

export interface OptionsAnalyse {
  regles?: boolean;
  recherche?: boolean;
}

// Pipeline complet sur un texte déjà masqué : B par défaut, C avec les deux options à false.
export async function analyser(
  texte: string,
  options: OptionsAnalyse = {}
): Promise<AnalyseResponse> {
  const { regles = true, recherche = true } = options;
  const systeme = `regles=${regles ? 1 : 0};recherche=${recherche ? 1 : 0}`;

  const resultatRegles: ResultatRegles = regles
    ? evaluateRules(texte)
    : { signaux: [], plancher_suspect: false };

  const arnaquesProches: ArnaqueProche[] = recherche
    ? await retrieveSimilarScams(texte, 3)
    : [];

  const resultatLLM = await analyzeWithLLM(
    texte,
    resultatRegles.signaux,
    arnaquesProches,
    getAllConduiteIds(),
    systeme
  );

  // Plancher : une règle dure interdit « aucun_signal », quelle que soit la réponse du modèle.
  let niveauFinal: NiveauAlerte = resultatLLM.niveau;
  const signauxFinaux = [...resultatLLM.signaux];

  if (resultatRegles.plancher_suspect && niveauFinal === "aucun_signal") {
    niveauFinal = "suspect";
    for (const regle of resultatRegles.signaux) {
      if (!signauxFinaux.includes(regle.description) && signauxFinaux.length < 3) {
        signauxFinaux.push(regle.description);
      }
    }
  }

  const conduite = getResolvedConduite(resultatLLM.conduite_id);

  return {
    niveau: niveauFinal,
    signaux: signauxFinaux,
    explication: resultatLLM.explication,
    conduite_id: conduite.id,
    conduite: { texte: conduite.texte, contacts: conduite.contacts },
    arnaques_proches: arnaquesProches,
    version_prompt: VERSION_PROMPT,
  };
}

