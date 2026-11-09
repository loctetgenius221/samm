import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { maskText } from "../lib/mask";
import type { ConduiteEntree, ScamEntree } from "../lib/types";

type Arnaque = Partial<ScamEntree>;
type Conduite = Partial<ConduiteEntree>;

const CHAMPS_OBLIGATOIRES: (keyof ScamEntree)[] = [
  "id",
  "operateur",
  "langue",
  "canal",
  "niveau",
  "resume",
  "exemple_masque",
  "signaux",
  "conduite_id",
  "source",
  "date_source",
];

const NIVEAUX = ["danger", "suspect", "aucun_signal"];

const estVide = (valeur: unknown): boolean =>
  valeur === undefined ||
  valeur === null ||
  (typeof valeur === "string" && valeur.trim() === "") ||
  (Array.isArray(valeur) && valeur.length === 0);

export const estDateIso = (date: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));

export function erreursConduite(conduite: Conduite): string[] {
  const nom = conduite.id || "sans id";
  const erreurs: string[] = [];

  if (estVide(conduite.id)) erreurs.push("conduite sans 'id'");
  if (estVide(conduite.texte)) erreurs.push(`conduite '${nom}' : 'texte' manquant`);
  if (!Array.isArray(conduite.contacts)) {
    erreurs.push(`conduite '${nom}' : 'contacts' doit être une liste`);
    return erreurs;
  }

  for (const contact of conduite.contacts) {
    const libelle = `conduite '${nom}', contact '${contact.type ?? "inconnu"}'`;
    if (estVide(contact.source)) erreurs.push(`${libelle} : 'source' manquante`);
    if (!estVide(contact.valeur) && !estDateIso(contact.date_source ?? "")) {
      erreurs.push(`${libelle} : un contact renseigné exige une 'date_source' AAAA-MM-JJ`);
    }
  }
  return erreurs;
}

export function erreursArnaque(arnaque: Arnaque, conduiteIds: Set<string>): string[] {
  const erreurs = CHAMPS_OBLIGATOIRES.filter((champ) => estVide(arnaque[champ])).map(
    (champ) => `champ '${champ}' manquant`
  );

  if (arnaque.niveau && !NIVEAUX.includes(arnaque.niveau)) {
    erreurs.push(`niveau '${arnaque.niveau}' invalide (attendu : ${NIVEAUX.join(", ")})`);
  }
  if (arnaque.date_source && !estDateIso(arnaque.date_source)) {
    erreurs.push(`date_source '${arnaque.date_source}' invalide (attendu : AAAA-MM-JJ)`);
  }
  if (arnaque.conduite_id && !conduiteIds.has(arnaque.conduite_id)) {
    erreurs.push(`conduite_id '${arnaque.conduite_id}' absent de conduite.yaml`);
  }
  if (arnaque.exemple_masque && maskText(arnaque.exemple_masque) !== arnaque.exemple_masque) {
    erreurs.push("exemple_masque contient des données non masquées (numéro, montant, lien ou nom)");
  }
  return erreurs;
}

function lireArnaques(dossier: string): Map<string, Arnaque> {
  const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".json") && f !== "schema.json");
  return new Map(
    fichiers.map((f) => [f, JSON.parse(fs.readFileSync(path.join(dossier, f), "utf-8")) as Arnaque])
  );
}

export function validerDonnees(racine = process.cwd()): string[] {
  const conduites = yaml.parse(fs.readFileSync(path.join(racine, "conduite.yaml"), "utf-8"));
  if (!Array.isArray(conduites)) return ["conduite.yaml doit contenir une liste"];

  const erreurs = (conduites as Conduite[]).flatMap(erreursConduite).map((e) => `conduite.yaml : ${e}`);
  const conduiteIds = new Set((conduites as Conduite[]).map((c) => c.id).filter((id) => id !== undefined));
  const idsVus = new Set<string>();

  for (const [fichier, arnaque] of lireArnaques(path.join(racine, "scams"))) {
    const erreursFichier = erreursArnaque(arnaque, conduiteIds);
    if (arnaque.id && idsVus.has(arnaque.id)) erreursFichier.push(`id '${arnaque.id}' en double`);
    if (arnaque.id) idsVus.add(arnaque.id);
    erreurs.push(...erreursFichier.map((e) => `scams/${fichier} : ${e}`));
  }
  return erreurs;
}

if (require.main === module) {
  try {
    const erreurs = validerDonnees();
    if (erreurs.length > 0) {
      console.error(`❌ ${erreurs.length} erreur(s) dans les données :`);
      erreurs.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }
    console.log("✅ scams/ et conduite.yaml sont conformes.");
  } catch (erreur) {
    console.error(`❌ Lecture des données impossible : ${erreur instanceof Error ? erreur.message : erreur}`);
    process.exit(1);
  }
}
