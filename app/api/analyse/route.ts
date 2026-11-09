import { NextResponse } from "next/server";
import type {
  AnalyseRequest,
  AnalyseResponse,
  AnalyseErrorResponse,
  NiveauAlerte,
} from "@/lib/types";
import { evaluateRules } from "@/lib/rules";
import { retrieveSimilarScams } from "@/lib/retrieve";
import { analyzeWithLLM, VERSION_PROMPT } from "@/lib/llm";
import { getAllConduiteIds, getResolvedConduite } from "@/lib/conduite";

/**
 * Endpoint POST /api/analyse
 *
 * Pipeline d'analyse en 5 étapes :
 * 1. Validation stricte de l'entrée (texte non vide, 2000 caractères max).
 * 2. Analyse heuristique déterministe (moteur de règles de garde-fou).
 * 3. Recherche lexicale TF-IDF par n-grammes d'arnaques proches dans scams/.
 * 4. Analyse par modèle de langage avec injection du contexte et des conduites autorisées.
 * 5. Application stricte du plancher suspect et résolution de la conduite à tenir.
 *
 * IMPORTANT :
 * - Aucun texte de message n'est journalisé ni stocké.
 * - Les erreurs ne divulguent jamais de secret, clé d'API ou détail interne.
 */
export async function POST(
  request: Request
): Promise<NextResponse<AnalyseResponse | AnalyseErrorResponse>> {
  try {
    let body: Partial<AnalyseRequest>;

    try {
      body = (await request.json()) as Partial<AnalyseRequest>;
    } catch {
      return NextResponse.json(
        {
          error: "REQUETE_INVALIDE",
          message: "Le corps de la requête doit être un JSON valide.",
        },
        { status: 400 }
      );
    }

    const { texte, source } = body;

    // 1. Validation des paramètres d'entrée
    if (!texte || typeof texte !== "string" || texte.trim().length === 0) {
      return NextResponse.json(
        {
          error: "TEXTE_MANQUANT",
          message: "Le champ 'texte' est obligatoire et ne doit pas être vide.",
        },
        { status: 400 }
      );
    }

    if (texte.length > 2000) {
      return NextResponse.json(
        {
          error: "TEXTE_TROP_LONG",
          message: "Le texte à analyser ne doit pas dépasser 2000 caractères.",
        },
        { status: 400 }
      );
    }

    if (source && source !== "texte" && source !== "capture") {
      return NextResponse.json(
        {
          error: "SOURCE_INVALIDE",
          message: "Le champ 'source' doit valoir 'texte' ou 'capture'.",
        },
        { status: 400 }
      );
    }

    // 2. Évaluation des règles déterministes (garde-fou)
    const resultatRegles = evaluateRules(texte);

    // 3. Recherche des arnaques proches par n-grammes TF-IDF (top 3 significatifs)
    const arnaquesProches = await retrieveSimilarScams(texte, 3);

    // 4. Récupération des conduites autorisées de conduite.yaml
    const listeConduites = getAllConduiteIds();

    // 5. Appel au modèle de langage avec le contexte complet
    const resultatLLM = await analyzeWithLLM(
      texte,
      resultatRegles.signaux,
      arnaquesProches,
      listeConduites
    );

    // 6. Application du plancher : si une règle dure s'est déclenchée,
    // le niveau ne peut pas être inférieur à « suspect », quelle que soit la réponse du modèle
    let niveauFinal: NiveauAlerte = resultatLLM.niveau;
    const signauxFinaux = [...resultatLLM.signaux];

    if (resultatRegles.plancher_suspect) {
      if (niveauFinal === "aucun_signal") {
        niveauFinal = "suspect";
        // Si le LLM n'avait produit aucun signal d'alerte, on injecte les signaux des règles dures
        for (const regle of resultatRegles.signaux) {
          if (!signauxFinaux.includes(regle.description) && signauxFinaux.length < 3) {
            signauxFinaux.push(regle.description);
          }
        }
      }
    }

    // 7. Vérification de l'existence du conduite_id et résolution (fallback générique si inexistant)
    const conduiteResolue = getResolvedConduite(resultatLLM.conduite_id);

    // 8. Construction de la réponse conforme au contrat
    const responseData: AnalyseResponse = {
      niveau: niveauFinal,
      signaux: signauxFinaux,
      explication: resultatLLM.explication,
      conduite_id: conduiteResolue.id,
      conduite: {
        texte: conduiteResolue.texte,
        // Uniquement les contacts vérifiés (a_verifier === false)
        contacts: conduiteResolue.contacts,
      },
      arnaques_proches: arnaquesProches,
      version_prompt: VERSION_PROMPT,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch {
    // IMPORTANT : Ne jamais journaliser le texte ni exposer de secrets ou détails internes
    return NextResponse.json(
      {
        error: "ERREUR_SERVEUR",
        message: "Une erreur est survenue lors de l'analyse du message.",
      },
      { status: 500 }
    );
  }
}
