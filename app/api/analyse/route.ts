import { NextResponse } from "next/server";
import type { AnalyseRequest, AnalyseResponse, AnalyseErrorResponse } from "@/lib/types";

/**
 * Endpoint POST /api/analyse
 * Valide la requête et renvoie pour le moment un verdict fixe « suspect » conforme au contrat.
 * En cas d'erreur HTTP, le client doit afficher « suspect » par défaut.
 */
export async function POST(request: Request): Promise<NextResponse<AnalyseResponse | AnalyseErrorResponse>> {
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

    // Validation des paramètres d'entrée
    if (!texte || typeof texte !== "string" || texte.trim().length === 0) {
      return NextResponse.json(
        {
          error: "TEXTE_MANQUANT",
          message: "Le champ 'texte' est obligatoire et ne doit pas être vide.",
        },
        { status: 400 }
      );
    }

    if (!source || (source !== "texte" && source !== "capture")) {
      return NextResponse.json(
        {
          error: "SOURCE_INVALIDE",
          message: "Le champ 'source' doit valoir 'texte' ou 'capture'.",
        },
        { status: 400 }
      );
    }

    // TODO: Connecter avec le pipeline complet (lib/rules.ts, lib/retrieve.ts, lib/llm.ts)
    // Réponse stub fixe respectant strictement le contrat d'analyse
    const responseData: AnalyseResponse = {
      niveau: "suspect",
      signaux: [
        "Demande d'action urgente non sollicitée",
        "Formulation incitant au transfert ou partage d'accès",
      ],
      explication:
        "Ce message présente des caractéristiques suspectes fréquentes dans les tentatives de fraude mobile money. Ne partagez aucun code secret et contactez votre opérateur via son canal officiel en cas de doute.",
      conduite_id: "conduite_suspicion_generale",
      arnaques_proches: [],
      version_prompt: "v0.1.0-stub",
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    // En cas d'exception inattendue
    return NextResponse.json(
      {
        error: "ERREUR_SERVEUR",
        message: error instanceof Error ? error.message : "Erreur interne du serveur d'analyse.",
      },
      { status: 500 }
    );
  }
}
