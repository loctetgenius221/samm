import fs from "node:fs";
import { z } from "zod";

export const CATEGORIES = [
  "arnaque",
  "variante_inedite",
  "injection",
  "legitime",
  "legitime_difficile",
] as const;

export const SPLITS = ["reglage", "mesure"] as const;

export const itemSchema = z.object({
  id: z.string().min(1),
  texte: z.string().min(1),
  attendu: z.enum(["danger", "suspect", "aucun_signal"]),
  categorie: z.enum(CATEGORIES),
  split: z.enum(SPLITS),
});

const datasetSchema = z.object({ items: z.array(itemSchema) });

export type ItemEval = z.infer<typeof itemSchema>;
export type Split = (typeof SPLITS)[number];

export function chargerDataset(chemin: string, split?: Split): ItemEval[] {
  const { items } = datasetSchema.parse(JSON.parse(fs.readFileSync(chemin, "utf-8")));
  return split ? items.filter((item) => item.split === split) : items;
}
