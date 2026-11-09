import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { maskText } from "../lib/mask";
import { chargerDataset, SPLITS, type ItemEval, type Split } from "./dataset";
import { calculerMetriques, formaterCompte, type Metriques, type Prediction } from "./metrics";
import { SYSTEMES, type Systeme } from "./systemes";

const DOSSIER = path.join(process.cwd(), "eval");
const CHEMIN_JSON = path.join(DOSSIER, "results.json");
const CHEMIN_MD = path.join(DOSSIER, "results.md");

const COLONNES: [string, keyof Metriques][] = [
  ["Précision", "precision"],
  ["Rappel sur les arnaques", "rappelArnaques"],
  ["Rappel sur les variantes inédites", "rappelVariantesInedites"],
  ["Fausses alertes sur les légitimes difficiles", "faussesAlertesLegitimesDifficiles"],
  ["Injections détectées", "injectionsDetectees"],
];

export interface Resultat {
  systeme: string;
  description: string;
  version: string;
  split: string;
  date: string;
  messages: number;
  metriques: Metriques;
}

const estSplit = (valeur: string): valeur is Split => (SPLITS as readonly string[]).includes(valeur);

export async function evaluer(items: ItemEval[], systeme: Systeme): Promise<Prediction[]> {
  const predictions: Prediction[] = [];
  // Séquentiel pour rester sous les quotas par minute du modèle.
  for (const item of items) {
    predictions.push({ item, niveau: await systeme.analyser(maskText(item.texte)) });
  }
  return predictions;
}

export function rendreResultats(resultats: Resultat[]): string {
  const ligne = (cellules: string[]) => `| ${cellules.join(" | ")} |`;
  const entete = ["Système", "Jeu", "Version", "Date", "Messages", ...COLONNES.map(([titre]) => titre)];
  const lignes = resultats.map((r) => [
    `${r.systeme} : ${r.description}`,
    r.split,
    r.version,
    r.date,
    String(r.messages),
    ...COLONNES.map(([, cle]) => formaterCompte(r.metriques[cle])),
  ]);

  return [
    "# Résultats d'évaluation",
    "",
    "Fichier généré par `npm run eval`, ne pas modifier à la main. Les comptes se lisent « réussis sur total ».",
    "",
    ligne(entete),
    ligne(entete.map(() => "---")),
    ...lignes.map(ligne),
    "",
  ].join("\n");
}

function lireResultats(): Record<string, Resultat> {
  return fs.existsSync(CHEMIN_JSON) ? JSON.parse(fs.readFileSync(CHEMIN_JSON, "utf-8")) : {};
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { system: { type: "string", default: "A" }, split: { type: "string" } },
  });
  const nom = values.system;
  const systeme = SYSTEMES[nom];
  if (!systeme) throw new Error(`système '${nom}' inconnu (disponibles : ${Object.keys(SYSTEMES).join(", ")})`);
  if (values.split && !estSplit(values.split)) throw new Error(`jeu '${values.split}' inconnu (${SPLITS.join(", ")})`);

  const split = values.split as Split | undefined;
  const items = chargerDataset(path.join(DOSSIER, "dataset.json"), split);
  const resultat: Resultat = {
    systeme: nom,
    description: systeme.description,
    version: systeme.version,
    split: split ?? "complet",
    date: new Date().toISOString().slice(0, 10),
    messages: items.length,
    metriques: calculerMetriques(await evaluer(items, systeme)),
  };

  const resultats = { ...lireResultats(), [`${nom}:${resultat.split}`]: resultat };
  const tries = Object.keys(resultats).sort().map((cle) => resultats[cle]);
  const markdown = rendreResultats(tries);
  fs.writeFileSync(CHEMIN_JSON, `${JSON.stringify(resultats, null, 2)}\n`);
  fs.writeFileSync(CHEMIN_MD, markdown);
  console.log(markdown);
}

if (require.main === module) {
  main().catch((erreur: unknown) => {
    console.error(`❌ Évaluation impossible : ${erreur instanceof Error ? erreur.message : erreur}`);
    process.exit(1);
  });
}
