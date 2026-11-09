import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";
import { maskText } from "../lib/mask";
import { formaterCompte, type Compte } from "./metrics";

const TYPES = ["noms", "numeros", "montants"] as const;
type TypeDonnee = (typeof TYPES)[number];

const valeurs = z.array(z.string()).default([]);
const casSchema = z.object({ texte: z.string().min(1), noms: valeurs, numeros: valeurs, montants: valeurs });

export type Cas = z.infer<typeof casSchema>;
export type Mesure = Record<TypeDonnee, { masques: Compte; fuites: string[] }>;

export function mesurerFuites(cas: Cas[]): Mesure {
  const textesMasques = cas.map((c) => maskText(c.texte));
  const mesurer = (type: TypeDonnee) => {
    const fuites = cas.flatMap((c, i) => c[type].filter((valeur) => textesMasques[i].includes(valeur)));
    const total = cas.reduce((somme, c) => somme + c[type].length, 0);
    return { masques: { ok: total - fuites.length, total }, fuites };
  };
  return Object.fromEntries(TYPES.map((type) => [type, mesurer(type)])) as Mesure;
}

function rendre(mesure: Mesure, nombreCas: number): string {
  const lignes = TYPES.map(
    (type) => `| ${type} | ${formaterCompte(mesure[type].masques)} | ${mesure[type].fuites.join(", ") || "aucune"} |`
  );
  return [
    "# Fuites du masquage",
    "",
    `Fichier généré par \`npm run eval:fuites\` sur ${nombreCas} messages fictifs (\`eval/fuites.yaml\`). Le masquage se fait au mieux, sans garantie.`,
    "",
    "| Donnée | Masquées | Fuites |",
    "| --- | --- | --- |",
    ...lignes,
    "",
  ].join("\n");
}

if (require.main === module) {
  const dossier = path.join(process.cwd(), "eval");
  const cas = z.array(casSchema).parse(yaml.parse(fs.readFileSync(path.join(dossier, "fuites.yaml"), "utf-8")));
  const markdown = rendre(mesurerFuites(cas), cas.length);
  fs.writeFileSync(path.join(dossier, "fuites.md"), markdown);
  console.log(markdown);
}
