"use client";

import { useState } from "react";
import { AnalyseForm } from "@/components/AnalyseForm";
import { ResultZone, type ResultatAffichage } from "@/components/ResultZone";

export default function Home() {
  const [resultat, setResultat] = useState<ResultatAffichage | null>(null);
  const [enChargement, setEnChargement] = useState(false);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-6 md:p-8">
      {/* En-tête de l'application */}
      <header className="w-full max-w-lg pt-4 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-amber-400">
          <span>🛡️</span>
          <span>Open Source × AI — Galsen DEV</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Sàmm
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Aide au repérage des arnaques et fraudes mobile money au Sénégal
        </p>
      </header>

      {/* Contenu principal : Formulaire et Zone de résultat */}
      <main className="w-full max-w-lg flex-1 space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-xl backdrop-blur">
          <AnalyseForm
            onResultat={setResultat}
            onChargementChange={setEnChargement}
          />
        </div>

        <ResultZone resultat={resultat} enChargement={enChargement} />
      </main>

      {/* Pied de page avec avertissement légal et mention discrète */}
      <footer className="w-full max-w-lg py-6 text-center text-xs text-slate-500">
        <p className="leading-relaxed">
          Sàmm aide à repérer les arnaques, il ne garantit rien.
        </p>
        <p className="mt-1 text-[11px] text-slate-600">
          Projet communautaire libre développé pour la protection des utilisateurs de mobile money.
        </p>
      </footer>
    </div>
  );
}
