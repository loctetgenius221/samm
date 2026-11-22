import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";
import { maskText } from "../lib/mask";
import { formaterCompte, type Compte } from "./metrics";

const LIBELLES = {
  noms: "Noms du dictionnaire",
  noms_inconnus: "Noms hors dictionnaire",
  numeros: "Numéros",
  montants: "Montants",
};

const TYPES = Object.keys(LIBELLES) as (keyof typeof LIBELLES)[];
type TypeDonnee = (typeof TYPES)[number];

const valeurs = z.array(z.string()).default([]);
const casSchema = z.object({
  texte: z.string().min(1),
  noms: valeurs,
  noms_inconnus: valeurs,
  numeros: valeurs,
  montants: valeurs,
});

export type Cas = z.input<typeof casSchema>;
export type Mesure = Record<TypeDonnee, { masques: Compte; fuites: string[] }>;

export function mesurerFuites(cas: Cas[], masquer: (texte: string) => string = maskText): Mesure {
  const complets = cas.map((c) => casSchema.parse(c));
  const textesMasques = complets.map((c) => masquer(c.texte));
  const mesurer = (type: TypeDonnee) => {
    const fuites = complets.flatMap((c, i) => c[type].filter((valeur) => textesMasques[i].includes(valeur)));
    const total = complets.reduce((somme, c) => somme + c[type].length, 0);
    return { masques: { ok: total - fuites.length, total }, fuites };
  };
  return Object.fromEntries(TYPES.map((type) => [type, mesurer(type)])) as Mesure;
}

function rendre(mesure: Mesure, nombreCas: number): string {
  const lignes = TYPES.map(
    (type) => `| ${LIBELLES[type]} | ${formaterCompte(mesure[type].masques)} | ${mesure[type].fuites.join(", ") || "aucune"} |`
  );
  return [
    "# Fuites du masquage",
    "",
    `Fichier généré par \`npm run eval:fuites\` sur ${nombreCas} messages fictifs (\`eval/fuites.yaml\`). Le masquage se fait au mieux, sans garantie.`,
    "",
    "Les noms du dictionnaire figurent dans `lib/noms.ts`. Les noms hors dictionnaire n'y sont pas : ils ne sont masqués que grâce au contexte (« Salut », « c'est », « de la part de »…), ou pas du tout.",
    "",
    "| Donnée | Masquées | Fuites |",
    "| --- | --- | --- |",
    ...lignes,
    "",
  ].join("\n");
}

if (require.main === module) {
  const dossier = path.join(process.cwd(), "eval");
  const cas = yaml.parse(fs.readFileSync(path.join(dossier, "fuites.yaml"), "utf-8")) as Cas[];
  const markdown = rendre(mesurerFuites(cas), cas.length);
  fs.writeFileSync(path.join(dossier, "fuites.md"), markdown);
  console.log(markdown);
}
