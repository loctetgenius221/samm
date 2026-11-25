"use client";

import { useEffect, useRef } from "react";
import type { ContactConduite, NiveauAlerte } from "@/lib/types";
import { Icone, type NomIcone } from "./Icone";
import { partagerAlerte } from "@/lib/carte-image";

export interface ResultatAffichage {
  niveau: NiveauAlerte;
  signaux: string[];
  explication: string;
  conduiteTexte: string;
  conduiteContacts?: ContactConduite[];
}

const VERDICTS: Record<NiveauAlerte, { titre: string; consigne: string; icone: NomIcone; couleurs: string }> = {
  danger: {
    titre: "Danger",
    consigne: "C'est très probablement une arnaque. Ne répondez pas, n'envoyez ni argent ni code.",
    icone: "danger",
    couleurs: "bg-danger text-sur-danger",
  },
  suspect: {
    titre: "Suspect",
    consigne: "Ne faites rien avant d'avoir vérifié auprès de votre opérateur.",
    icone: "suspect",
    couleurs: "bg-suspect text-sur-suspect",
  },
  aucun_signal: {
    titre: "Aucun signal détecté",
    consigne: "Sàmm n'a rien repéré, mais aucun outil ne garantit qu'un message est sans risque.",
    icone: "info",
    couleurs: "bg-neutre text-sur-neutre",
  },
};

const lienContact = (valeur: string): string => {
  if (/^https?:\/\//.test(valeur)) return valeur;
  return /[a-z]\.[a-z]/i.test(valeur) ? `https://${valeur}` : `tel:${valeur.replace(/\s/g, "")}`;
};


interface ResultZoneProps {
  resultat: ResultatAffichage;
  onRecommencer: () => void;
}

export function ResultZone({ resultat, onRecommencer }: ResultZoneProps) {
  const titre = useRef<HTMLHeadingElement>(null);
  const verdict = VERDICTS[resultat.niveau];

  useEffect(() => {
    window.scrollTo(0, 0);
    titre.current?.focus();
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <section
        className={`animate-verdict rounded-b-[2rem] px-5 pt-10 pb-8 motion-reduce:animate-none ${verdict.couleurs}`}
      >
        <Icone nom={verdict.icone} className="size-14" />
        <h1 ref={titre} tabIndex={-1} className="mt-4 text-[2.75rem] leading-none font-extrabold tracking-tight outline-none">
          {verdict.titre}
        </h1>
        <p className="mt-4 text-lg leading-snug font-bold">{verdict.consigne}</p>
      </section>

      <main className="flex-1 space-y-8 px-5 pt-8 pb-4">
        <section aria-labelledby="pourquoi">
          <h2 id="pourquoi" className="text-[1.375rem] font-extrabold">
            Pourquoi
          </h2>
          <ul className="mt-3 space-y-2">
            {resultat.signaux.map((signal) => (
              <li key={signal} className="flex gap-3 font-bold">
                <span className="mt-2.5 size-2 shrink-0 rounded-full bg-marque" aria-hidden="true" />
                {signal}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-encre-douce">{resultat.explication}</p>
        </section>

        <section aria-labelledby="que-faire">
          <h2 id="que-faire" className="text-[1.375rem] font-extrabold">
            Que faire
          </h2>
          <p className="mt-3">{resultat.conduiteTexte}</p>
          {resultat.conduiteContacts?.map((contact) => (
            <a
              key={contact.valeur}
              href={lienContact(contact.valeur)}
              className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-trait bg-carte p-4"
            >
              <Icone nom={lienContact(contact.valeur).startsWith("tel:") ? "telephone" : "lien"} className="size-6 text-marque" />
              <span>
                <span className="block font-bold">{contact.valeur}</span>
                <span className="block text-sm text-encre-douce">Source : {contact.source}</span>
              </span>
            </a>
          ))}
        </section>
      </main>

      <footer className="sticky bottom-0 space-y-3 bg-fond/90 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button type="button" onClick={() => void partagerAlerte(resultat)} className="bouton bouton-secondaire">
          <Icone nom="partager" />
          Partager l&apos;alerte
        </button>
        <button type="button" onClick={onRecommencer} className="bouton bouton-principal">
          Vérifier un autre message
        </button>
      </footer>
    </div>
  );
}
