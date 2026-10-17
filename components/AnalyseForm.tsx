"use client";

import { useState } from "react";
import { maskText } from "@/lib/mask";
import { getTexteConduite } from "@/lib/conduite";
import type { AnalyseRequest, AnalyseResponse, AnalyseErrorResponse } from "@/lib/types";
import type { ResultatAffichage } from "./ResultZone";

interface AnalyseFormProps {
  onResultat: (res: ResultatAffichage) => void;
  onChargementChange: (enCours: boolean) => void;
}

export function AnalyseForm({ onResultat, onChargementChange }: AnalyseFormProps) {
  const [texte, setTexte] = useState("");
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!texte.trim()) {
      setErreurSaisie("Veuillez coller ou saisir le message suspect à analyser.");
      return;
    }

    setErreurSaisie(null);
    setChargement(true);
    onChargementChange(true);

    try {
      // Masquage préalable des données sensibles côté client
      const texteMasque = maskText(texte);

      const payload: AnalyseRequest = {
        texte: texteMasque,
        source: "texte",
      };

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as Partial<AnalyseErrorResponse>;
        // Règle : Si l'API échoue, on affiche « suspect » par défaut avec un message d'erreur clair
        onResultat({
          niveau: "suspect",
          signaux: ["Échec de communication avec le service d'analyse"],
          explication:
            "L'analyse n'a pas pu être complétée par le serveur. Par mesure de précaution, traitez ce message comme suspect.",
          conduiteTexte: getTexteConduite("conduite_suspicion_generale"),
          estErreur: true,
          messageErreur:
            errorData.message ||
            "Le service d'analyse est momentanément indisponible. Le verdict 'suspect' est appliqué par précaution.",
        });
      } else {
        const data = (await res.json()) as AnalyseResponse;
        onResultat({
          niveau: data.niveau,
          signaux: data.signaux,
          explication: data.explication,
          conduiteTexte: getTexteConduite(data.conduite_id),
          estErreur: false,
        });
      }
    } catch {
      // Erreur réseau ou exception imprévue
      onResultat({
        niveau: "suspect",
        signaux: ["Connexion impossible au serveur d'analyse"],
        explication:
          "Impossible de joindre le serveur pour analyser le message. Dans le doute, considérez le contenu comme suspect.",
        conduiteTexte: getTexteConduite("conduite_suspicion_generale"),
        estErreur: true,
        messageErreur:
          "Une erreur réseau est survenue. Par précaution, nous appliquons un niveau suspect.",
      });
    } finally {
      setChargement(false);
      onChargementChange(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* Champ de saisie du message */}
      <div className="space-y-2">
        <label
          htmlFor="message-suspect"
          className="block text-sm font-semibold text-slate-200"
        >
          Colle le message suspect
        </label>
        <textarea
          id="message-suspect"
          name="message"
          rows={5}
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            if (erreurSaisie) setErreurSaisie(null);
          }}
          placeholder="Exemple : Félicitations, vous avez reçu un gain de... Transférez le code..."
          className="w-full resize-none rounded-xl border border-slate-800 bg-slate-900/90 p-4 text-sm text-slate-100 placeholder-slate-500 shadow-inner outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          aria-describedby={erreurSaisie ? "erreur-saisie" : undefined}
        />
        {erreurSaisie && (
          <p id="erreur-saisie" className="text-xs font-medium text-red-400">
            {erreurSaisie}
          </p>
        )}
      </div>

      {/* Zone d'ajout de capture d'écran (non branchée, avec TODO) */}
      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center">
        {/* TODO: Connecter l'upload d'image avec le module OCR (lib/ocr) */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <span className="text-xl" role="img" aria-hidden="true">
            📷
          </span>
          <p className="text-xs font-medium text-slate-300">
            Ajouter une capture d&apos;écran
          </p>
          <span className="inline-block rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
            OCR bientôt disponible (TODO)
          </span>
        </div>
      </div>

      {/* Bouton d'action Analyser */}
      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {chargement ? "Analyse en cours..." : "Analyser"}
      </button>
    </form>
  );
}
