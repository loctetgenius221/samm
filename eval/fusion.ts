import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";
import { maskText } from "../lib/mask";
import { itemSchema, type ItemEval } from "./dataset";
import { formaterCompte, type Compte } from "./metrics";

const messageSchema = itemSchema.partial({ attendu: true });
const etiquettesSchema = z.record(z.string(), itemSchema.shape.attendu);

export type Message = z.infer<typeof messageSchema>;
export type Etiquettes = z.infer<typeof etiquettesSchema>;

export interface Desaccord {
  id: string;
  etiquettes: Record<string, string | undefined>;
}

export interface Fusion {
  items: ItemEval[];
  desaccords: Desaccord[];
  accord: Compte;
}

export function fusionner(messages: Message[], annotations: Record<string, Etiquettes>): Fusion {
  const fusion: Fusion = { items: [], desaccords: [], accord: { ok: 0, total: 0 } };

  for (const message of messages) {
    const etiquettes = Object.fromEntries(
      Object.entries(annotations).map(([annotateur, valeurs]) => [annotateur, valeurs[message.id]])
    );
    const niveaux = Object.values(etiquettes);
    const complet = niveaux.length > 0 && niveaux.every((n) => n !== undefined);
    const consensus = complet && new Set(niveaux).size === 1 ? niveaux[0] : undefined;

    if (complet) fusion.accord.total++;
    if (consensus) fusion.accord.ok++;

    const attendu = message.attendu ?? consensus;
    if (attendu) fusion.items.push({ ...message, attendu });
    else fusion.desaccords.push({ id: message.id, etiquettes });
  }
  return fusion;
}

const DOSSIER = path.join(process.cwd(), "eval");
const lireYaml = (chemin: string): unknown => yaml.parse(fs.readFileSync(chemin, "utf-8")) ?? undefined;

function lireAnnotations(dossier: string): Record<string, Etiquettes> {
  const fichiers = fs.readdirSync(dossier).filter((f) => f.endsWith(".yaml"));
  return Object.fromEntries(
    fichiers.map((f) => [path.basename(f, ".yaml"), etiquettesSchema.parse(lireYaml(path.join(dossier, f)) ?? {})])
  );
}

function main(): void {
  const messages = z.array(messageSchema).parse(lireYaml(path.join(DOSSIER, "messages.yaml")) ?? []);
  const nonMasques = messages.filter((m) => maskText(m.texte) !== m.texte).map((m) => m.id);
  if (nonMasques.length > 0) throw new Error(`textes non masqués : ${nonMasques.join(", ")}`);
  const ids = messages.map((m) => m.id);
  const doublons = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (doublons.length > 0) throw new Error(`id en double : ${doublons.join(", ")}`);

  const { items, desaccords, accord } = fusionner(messages, lireAnnotations(path.join(DOSSIER, "etiquettes")));
  const description = "Généré par npm run eval:fusion depuis eval/messages.yaml et eval/etiquettes/. Ne pas modifier à la main.";
  fs.writeFileSync(path.join(DOSSIER, "dataset.json"), `${JSON.stringify({ $description: description, items }, null, 2)}\n`);

  console.log(`✅ ${items.length} message(s) sur ${messages.length} écrits dans eval/dataset.json`);
  console.log(`🤝 Accord entre annotateurs : ${formaterCompte(accord)}`);
  if (desaccords.length > 0) console.log("⚖️  À trancher ensemble (ajoutez « attendu » dans messages.yaml) :");
  for (const { id, etiquettes } of desaccords) {
    const detail = Object.entries(etiquettes).map(([annotateur, niveau]) => `${annotateur} = ${niveau ?? "—"}`);
    console.log(`  - ${id} : ${detail.join(", ")}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (erreur) {
    console.error(`❌ Fusion impossible : ${erreur instanceof Error ? erreur.message : erreur}`);
    process.exit(1);
  }
}
