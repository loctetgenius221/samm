import { NextResponse } from "next/server";
import type {
  AnalyseRequest,
  AnalyseResponse,
  AnalyseErrorResponse,
} from "@/lib/types";
import { analyser } from "@/lib/analyse";

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

    const responseData = await analyser(texte);
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
