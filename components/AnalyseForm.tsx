"use client";

import { useState } from "react";
import { maskText } from "@/lib/mask";
import { readText } from "@/lib/ocr";
import type { AnalyseRequest, AnalyseResponse, SourceAnalyse } from "@/lib/types";
import { Icone } from "./Icone";
import { Logo } from "./Logo";
import type { ResultatAffichage } from "./ResultZone";

const DEPOT = "https://github.com/loctetgenius221/samm";

const CONDUITE_SECOURS =
  "Ne communiquez aucun code secret. En cas de doute, appelez le service client officiel de votre opérateur.";

const RESULTAT_INDISPONIBLE: ResultatAffichage = {
  niveau: "suspect",
  signaux: ["Vérification impossible pour le moment"],
  explication: "Sàmm n'a pas pu joindre son service d'analyse. Par précaution, considérez ce message comme suspect.",
  conduiteTexte: CONDUITE_SECOURS,
};

async function analyser(texte: string, source: SourceAnalyse): Promise<ResultatAffichage> {
  const requete: AnalyseRequest = { texte: maskText(texte), source };
  const reponse = await fetch("/api/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requete),
  });
  if (!reponse.ok) return RESULTAT_INDISPONIBLE;

  const donnees = (await reponse.json()) as AnalyseResponse;
  return {
    niveau: donnees.niveau,
    signaux: donnees.signaux,
    explication: donnees.explication,
    conduiteTexte: donnees.conduite?.texte || CONDUITE_SECOURS,
    conduiteContacts: donnees.conduite?.contacts ?? [],
  };
}

export function AnalyseForm({ onResultat }: { onResultat: (resultat: ResultatAffichage) => void }) {
  const [texte, setTexte] = useState("");
  const [source, setSource] = useState<SourceAnalyse>("texte");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<"lecture" | "verification" | null>(null);

  function remplir(valeur: string, origine: SourceAnalyse) {
    setTexte(valeur);
    setSource(origine);
    setErreur(null);
  }

  async function coller() {
    try {
      const contenu = await navigator.clipboard.readText();
      if (!contenu.trim()) throw new Error("presse-papiers vide");
      remplir(contenu, "texte");
    } catch {
      setErreur("Collage impossible. Appuyez longuement dans la zone de texte, puis choisissez Coller.");
    }
  }

  async function lireCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const image = e.target.files?.[0];
    e.target.value = "";
    if (!image) return;

    setOccupation("lecture");
    try {
      const texteLu = await readText(image);
      if (!texteLu) throw new Error("aucun texte");
      remplir(texteLu, "capture");
    } catch {
      setErreur("Aucun texte lisible sur cette image. Essayez une capture plus nette ou collez le message.");
    } finally {
      setOccupation(null);
    }
  }

  async function verifier() {
    if (!texte.trim()) {
      setErreur("Collez d'abord le message à vérifier.");
      return;
    }
    setOccupation("verification");
    try {
      onResultat(await analyser(texte, source));
    } catch {
      onResultat(RESULTAT_INDISPONIBLE);
    } finally {
      setOccupation(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verifier();
      }}
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5"
    >
      <header className="py-4">
        <Logo />
      </header>

      <main className="flex-1 pt-6">
        <h1 className="text-[1.875rem] leading-tight font-extrabold tracking-tight text-balance">
          Un message vous paraît louche ?
        </h1>
        <p className="mt-2 text-encre-douce">
          Collez-le ou ajoutez une capture d&apos;écran. Sàmm vous dit s&apos;il faut vous méfier.
        </p>

        <label htmlFor="message-suspect" className="sr-only">
          Message à vérifier
        </label>
        <textarea
          id="message-suspect"
          value={texte}
          onChange={(e) => remplir(e.target.value, e.target.value ? source : "texte")}
          placeholder="Collez le message ici"
          rows={6}
          aria-describedby={erreur ? "erreur-saisie" : undefined}
          className="mt-6 w-full resize-none rounded-3xl border-2 border-trait bg-carte p-5 leading-relaxed placeholder:text-encre-douce focus:border-marque focus:outline-none"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" onClick={coller} className="bouton bouton-secondaire">
            <Icone nom="coller" />
            Coller
          </button>
          <label className="bouton bouton-secondaire has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-marque">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={lireCapture}
              disabled={occupation !== null}
            />
            <Icone nom="image" />
            <span aria-live="polite">{occupation === "lecture" ? "Lecture..." : "Capture"}</span>
          </label>
        </div>

        {erreur && (
          <p id="erreur-saisie" role="alert" className="mt-4 rounded-2xl border-l-4 border-danger bg-carte p-4 font-bold">
            {erreur}
          </p>
        )}

        <p className="mt-6 flex gap-2 text-sm text-encre-douce">
          <Icone nom="cadenas" className="mt-0.5 size-4 shrink-0" />
          Les numéros et montants sont masqués avant l&apos;envoi. La capture reste sur votre téléphone.
        </p>
      </main>

      <footer className="sticky bottom-0 -mx-5 bg-fond/90 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button type="submit" disabled={occupation !== null} className="bouton bouton-principal">
          {occupation === "verification" && (
            <span className="size-5 animate-spin rounded-full border-3 border-current border-t-transparent motion-reduce:animate-none" />
          )}
          {occupation === "verification" ? "Vérification..." : "Vérifier le message"}
        </button>
        <p className="mt-3 text-center text-xs text-encre-douce">
          Sàmm aide à repérer les arnaques, il ne garantit rien.{" "}
          <a href={DEPOT} className="font-bold underline underline-offset-2">
            Projet libre
          </a>
        </p>
      </footer>
    </form>
  );
}
