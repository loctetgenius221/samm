import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";

interface Contact {
  type?: string;
  valeur?: string;
  source?: string;
  date_source?: string;
  a_verifier?: boolean;
}

interface ConduiteEntry {
  id?: string;
  texte?: string;
  contacts?: Contact[];
}

interface ScamEntry {
  id?: string;
  operateur?: string;
  langue?: string;
  canal?: string;
  niveau?: string;
  resume?: string;
  exemple_masque?: string;
  signaux?: string[];
  conduite_id?: string;
  source?: string;
  date_source?: string;
}

const REQUIRED_SCAM_FIELDS: (keyof ScamEntry)[] = [
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

const VALID_NIVEAUX = ["danger", "suspect", "aucun_signal"];

export function validateData(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const rootDir = process.cwd();

  // 1. Validation de conduite.yaml
  const conduitePath = path.join(rootDir, "conduite.yaml");
  const conduiteIds = new Set<string>();

  if (!fs.existsSync(conduitePath)) {
    errors.push("Le fichier conduite.yaml est introuvable à la racine du projet.");
    return { isValid: false, errors };
  }

  let conduiteData: ConduiteEntry[] = [];
  try {
    const fileContent = fs.readFileSync(conduitePath, "utf-8");
    const parsed = yaml.parse(fileContent);
    if (!Array.isArray(parsed)) {
      errors.push("Le fichier conduite.yaml doit contenir une liste d'entrées.");
    } else {
      conduiteData = parsed as ConduiteEntry[];
    }
  } catch (err) {
    errors.push(`Erreur de syntaxe YAML dans conduite.yaml : ${err instanceof Error ? err.message : String(err)}`);
  }

  for (const [index, entry] of conduiteData.entries()) {
    const entryId = entry.id || `entrée_index_${index}`;

    if (!entry.id || typeof entry.id !== "string" || entry.id.trim() === "") {
      errors.push(`L'entrée #${index + 1} de conduite.yaml manque d'un champ 'id' valide.`);
    } else {
      conduiteIds.add(entry.id);
    }

    if (!entry.texte || typeof entry.texte !== "string" || entry.texte.trim() === "") {
      errors.push(`L'entrée '${entryId}' de conduite.yaml manque d'un champ 'texte' valide.`);
    }

    if (!Array.isArray(entry.contacts)) {
      errors.push(`L'entrée '${entryId}' de conduite.yaml doit définir une liste 'contacts'.`);
    } else {
      for (const [contactIndex, contact] of entry.contacts.entries()) {
        if (!contact.source || typeof contact.source !== "string" || contact.source.trim() === "") {
          errors.push(
            `L'entrée de conduite '${entryId}' a un contact (index ${contactIndex}, type '${contact.type || "inconnu"}') sans source.`
          );
        }
      }
    }
  }

  // 2. Validation des entrées de scams/
  const scamsDir = path.join(rootDir, "scams");
  if (!fs.existsSync(scamsDir)) {
    errors.push("Le dossier scams/ est introuvable.");
    return { isValid: false, errors };
  }

  const files = fs.readdirSync(scamsDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json") && f !== "schema.json");

  for (const filename of jsonFiles) {
    const filePath = path.join(scamsDir, filename);
    let scam: Partial<ScamEntry>;

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      scam = JSON.parse(content) as Partial<ScamEntry>;
    } catch (err) {
      errors.push(`Le fichier scams/${filename} n'est pas un JSON valide : ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    const scamId = scam.id || filename;

    // Vérification des champs obligatoires
    for (const field of REQUIRED_SCAM_FIELDS) {
      const val = scam[field];
      if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
        errors.push(`Le fichier scams/${filename} (id: '${scamId}') manque du champ obligatoire '${field}'.`);
      }
    }

    // Vérification spécifique de source et date_source
    if (!scam.source || typeof scam.source !== "string" || scam.source.trim() === "") {
      errors.push(`L'entrée '${scamId}' dans scams/${filename} n'a pas de 'source'.`);
    }

    if (!scam.date_source || typeof scam.date_source !== "string" || scam.date_source.trim() === "") {
      errors.push(`L'entrée '${scamId}' dans scams/${filename} n'a pas de 'date_source'.`);
    }

    // Vérification du niveau (interdiction formelle du terme « sûr »)
    if (scam.niveau) {
      if (!VALID_NIVEAUX.includes(scam.niveau)) {
        errors.push(
          `Le niveau '${scam.niveau}' de l'entrée '${scamId}' est invalide. Valeurs autorisées : ${VALID_NIVEAUX.join(", ")}.`
        );
      }
    }

    // Vérification du format des signaux
    if (scam.signaux && (!Array.isArray(scam.signaux) || scam.signaux.length === 0)) {
      errors.push(`L'entrée '${scamId}' doit comporter au moins un signal dans 'signaux'.`);
    }

    // Vérification de l'existence du conduite_id dans conduite.yaml
    if (scam.conduite_id) {
      if (!conduiteIds.has(scam.conduite_id)) {
        errors.push(
          `Le conduite_id '${scam.conduite_id}' de l'arnaque '${scamId}' n'existe pas dans conduite.yaml.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Exécution du script en ligne de commande
if (require.main === module || process.argv[1]?.endsWith("validate-data.ts")) {
  const result = validateData();

  if (!result.isValid) {
    console.error("\n❌ Échec de la validation des données :");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  } else {
    console.log("\n✅ Validation des données réussie : toutes les entrées de scams/ et conduite.yaml sont conformes.");
    process.exit(0);
  }
}
