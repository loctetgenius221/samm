"use client";

import { useState } from "react";
import { maskText } from "@/lib/mask";
import { readText } from "@/lib/ocr";
import type { AnalyseRequest, AnalyseResponse, AnalyseErrorResponse, SourceAnalyse } from "@/lib/types";
import type { ResultatAffichage } from "./ResultZone";

const CONDUITE_SECOURS_CLIENT =
  "Ne communiquez aucun code secret ni identifiant personnel. En cas de doute, contactez le service client officiel de votre opérateur mobile money.";

interface AnalyseFormProps {
  onResultat: (res: ResultatAffichage) => void;
  onChargementChange: (enCours: boolean) => void;
}

export function AnalyseForm({ onResultat, onChargementChange }: AnalyseFormProps) {
  const [texte, setTexte] = useState("");
  const [erreurSaisie, setErreurSaisie] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [source, setSource] = useState<SourceAnalyse>("texte");
  const [lectureCapture, setLectureCapture] = useState(false);

  async function lireCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const image = e.target.files?.[0];
    e.target.value = "";
    if (!image) return;

    setErreurSaisie(null);
    setLectureCapture(true);
    try {
      const texteLu = await readText(image);
      if (!texteLu) throw new Error("aucun texte");
      setTexte(texteLu);
      setSource("capture");
    } catch {
      setErreurSaisie("Impossible de lire le texte de cette capture. Colle le message à la place.");
    } finally {
      setLectureCapture(false);
    }
  }

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
        source,
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
          conduiteTexte: CONDUITE_SECOURS_CLIENT,
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
          conduiteTexte: data.conduite?.texte || CONDUITE_SECOURS_CLIENT,
          conduiteContacts: data.conduite?.contacts || [],
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
        conduiteTexte: CONDUITE_SECOURS_CLIENT,
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
            if (!e.target.value) setSource("texte");
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

      <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center transition focus-within:border-amber-500 hover:border-slate-600">
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={lireCapture}
          disabled={lectureCapture || chargement}
        />
        <span className="text-xl" aria-hidden="true">
          📷
        </span>
        <span className="text-xs font-medium text-slate-300" aria-live="polite">
          {lectureCapture ? "Lecture de la capture..." : "Ajouter une capture d'écran"}
        </span>
        <span className="text-[11px] text-slate-500">
          L&apos;image est lue sur ton téléphone, elle n&apos;est jamais envoyée.
        </span>
      </label>

      <button
        type="submit"
        disabled={chargement || lectureCapture}
        className="w-full rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {chargement ? "Analyse en cours..." : "Analyser"}
      </button>
    </form>
  );
}
