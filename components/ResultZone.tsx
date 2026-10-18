"use client";

import type { NiveauAlerte, ContactConduite } from "@/lib/types";

export interface ResultatAffichage {
  niveau: NiveauAlerte;
  signaux: string[];
  explication: string;
  conduiteTexte: string;
  conduiteContacts?: ContactConduite[];
  estErreur?: boolean;
  messageErreur?: string;
}

interface ResultZoneProps {
  resultat: ResultatAffichage | null;
  enChargement: boolean;
}

export function ResultZone({ resultat, enChargement }: ResultZoneProps) {
  if (enChargement) {
    return (
      <section
        aria-live="polite"
        className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center backdrop-blur"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400" />
          <p className="text-sm font-medium text-slate-300">
            Analyse des signaux en cours...
          </p>
        </div>
      </section>
    );
  }

  if (!resultat) {
    return null;
  }

  // Configuration du niveau avec symbole et texte explicite (pas uniquement une couleur)
  const configNiveau: Record<
    NiveauAlerte,
    {
      symbole: string;
      texte: string;
      badgeClasses: string;
      cardClasses: string;
    }
  > = {
    danger: {
      symbole: "🛑",
      texte: "DANGER",
      badgeClasses: "bg-red-950/80 text-red-200 border-red-700/60",
      cardClasses: "border-red-900/50 bg-red-950/20",
    },
    suspect: {
      symbole: "⚠️",
      texte: "SUSPECT",
      badgeClasses: "bg-amber-950/80 text-amber-200 border-amber-700/60",
      cardClasses: "border-amber-900/50 bg-amber-950/20",
    },
    aucun_signal: {
      symbole: "ℹ️",
      texte: "AUCUN SIGNAL DÉTECTÉ",
      badgeClasses: "bg-slate-800 text-slate-200 border-slate-700",
      cardClasses: "border-slate-800 bg-slate-900/40",
    },
  };

  const niveauActuel = configNiveau[resultat.niveau];

  return (
    <section
      aria-live="polite"
      className={`w-full space-y-5 rounded-2xl border p-5 sm:p-6 backdrop-blur transition-all ${niveauActuel.cardClasses}`}
    >
      {/* En-tête du résultat avec Symbole et Texte */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400">
            Verdict d&apos;analyse
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span
              className="text-2xl"
              role="img"
              aria-label={`Symbole ${niveauActuel.texte}`}
            >
              {niveauActuel.symbole}
            </span>
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-1 text-sm font-bold tracking-wide ${niveauActuel.badgeClasses}`}
            >
              {niveauActuel.symbole} {niveauActuel.texte}
            </span>
          </div>
        </div>
      </div>

      {/* Message spécifique en cas d'erreur de l'API */}
      {resultat.estErreur && (
        <div className="rounded-xl border border-amber-700/50 bg-amber-950/40 p-4 text-xs text-amber-200">
          <p className="font-semibold">Information de service :</p>
          <p className="mt-1">
            {resultat.messageErreur ||
              "L'analyse approfondie n'a pas pu aboutir. Par précaution, ce contenu est classé comme suspect."}
          </p>
        </div>
      )}

      {/* Signaux identifiés */}
      {resultat.signaux.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Signaux repérés
          </h3>
          <ul className="space-y-1.5">
            {resultat.signaux.map((signal, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-slate-200"
              >
                <span className="mt-1 text-xs text-slate-500">•</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Explication en français simple */}
      {resultat.explication && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Explication
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {resultat.explication}
          </p>
        </div>
      )}

      {/* Conduite à tenir (texte et contacts) */}
      {resultat.conduiteTexte && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Conduite à tenir
            </h3>
            <p className="text-sm leading-relaxed text-slate-200">
              {resultat.conduiteTexte}
            </p>
          </div>

          {resultat.conduiteContacts && resultat.conduiteContacts.length > 0 && (
            <div className="border-t border-slate-800/80 pt-3 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400">
                Contacts d&apos;assistance officiels vérifiés :
              </h4>
              <ul className="space-y-1.5">
                {resultat.conduiteContacts.map((contact, index) => (
                  <li
                    key={index}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-950/60 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-300 capitalize">
                      {contact.type.replace(/_/g, " ")} :
                    </span>
                    <span className="font-mono text-amber-300">
                      {contact.valeur}
                    </span>
                    {contact.source && (
                      <span className="text-[10px] text-slate-500">
                        (source : {contact.source})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions complémentaires (désactivées avec TODO) */}
      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        {/* TODO: Implémenter le partage d'alerte vers les réseaux / WhatsApp */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
        >
          Partager l&apos;alerte (Bientôt disponible)
        </button>

        {/* TODO: Permettre à l'utilisateur de soumettre l'arnaque pour enrichir le corpus scams/ */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
        >
          Proposer cette arnaque (Bientôt disponible)
        </button>
      </div>
    </section>
  );
}
