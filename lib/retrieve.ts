import fs from "node:fs";
import path from "node:path";
import type { ArnaqueProche, ScamEntree } from "./types";
import { normalizeText } from "./rules";

/**
 * Seuil minimal de similarité cosinus (sur n-grammes de caractères pondérés TF-IDF)
 * pour qu'une arnaque soit considérée comme significativement proche.
 */
export const SEUIL_SIMILARITE_MINIMALE = 0.12;

/**
 * Interface pour tout système de recherche et récupération d'arnaques similaires.
 * Permet d'abstraire le moteur sous-jacent (recherche lexicale TF-IDF aujourd'hui,
 * embeddings vectoriels neuronaux plus tard).
 */
export interface ScamRetriever {
  /**
   * Recherche les arnaques les plus similaires au texte masqué donné.
   *
   * @param texteMasque Texte à comparer au corpus
   * @param limit Nombre maximal de résultats (par défaut 3)
   * @returns Promesse contenant la liste des arnaques ordonnées par similarité
   */
  retrieve(texteMasque: string, limit?: number): Promise<ArnaqueProche[]>;
}

/**
 * Représentation vectorielle interne d'une arnaque du corpus.
 */
interface DocumentVector {
  id: string;
  resume: string;
  signaux: string[];
  weights: Map<string, number>;
  norm: number;
}

/**
 * Extrait les n-grammes de caractères d'un texte normalisé.
 * Utilise des tri- et quadrigrammes (n = 3..4) avec marges pour capturer
 * les préfixes, suffixes, et tolérer les fautes de frappe et variations.
 *
 * @param text Texte normalisé
 * @param nMin Taille minimale des n-grammes (défaut : 3)
 * @param nMax Taille maximale des n-grammes (défaut : 4)
 * @returns Map associant chaque n-gramme à sa fréquence brute (TF)
 */
export function extractCharNgrams(
  text: string,
  nMin = 3,
  nMax = 4
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!text) return counts;

  const padded = `  ${text}  `;
  for (let n = nMin; n <= nMax; n++) {
    if (padded.length < n) continue;
    for (let i = 0; i <= padded.length - n; i++) {
      const gram = padded.substring(i, i + n);
      counts.set(gram, (counts.get(gram) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Moteur de recherche lexicale d'arnaques par n-grammes de caractères pondérés (TF-IDF + cosinus).
 * Charge le corpus de scams/ une seule fois en mémoire pour des recherches instantanées.
 */
export class LexicalTFIDFRetriever implements ScamRetriever {
  private documents: DocumentVector[] = [];
  private idfMap = new Map<string, number>();
  private defaultIdf = 1;
  private isLoaded = false;
  private readonly corpusDir: string;

  constructor(corpusDir?: string) {
    this.corpusDir = corpusDir || path.join(process.cwd(), "scams");
  }

  /**
   * Force le rechargement et la réindexation du corpus.
   */
  public reload(): void {
    this.isLoaded = false;
    this.ensureLoaded();
  }

  /**
   * Garantit que le corpus est chargé et indexé une seule fois.
   */
  public ensureLoaded(): void {
    if (this.isLoaded) return;
    this.loadAndIndexCorpus();
    this.isLoaded = true;
  }

  /**
   * Lit les fichiers JSON du dossier scams/ et calcule les vecteurs TF-IDF.
   */
  private loadAndIndexCorpus(): void {
    this.documents = [];
    this.idfMap.clear();

    if (!fs.existsSync(this.corpusDir)) {
      return;
    }

    let files: string[];
    try {
      files = fs.readdirSync(this.corpusDir);
    } catch {
      return;
    }

    const jsonFiles = files.filter(
      (file) => file.endsWith(".json") && file !== "schema.json"
    );

    if (jsonFiles.length === 0) {
      return;
    }

    const parsedScams: ScamEntree[] = [];
    for (const filename of jsonFiles) {
      try {
        const filePath = path.join(this.corpusDir, filename);
        const content = fs.readFileSync(filePath, "utf-8");
        const scam = JSON.parse(content) as Partial<ScamEntree>;
        if (scam.id && scam.exemple_masque) {
          parsedScams.push({
            id: scam.id,
            operateur: scam.operateur || "",
            langue: scam.langue || "fr",
            canal: scam.canal || "SMS",
            niveau: scam.niveau || "suspect",
            resume: scam.resume || "",
            exemple_masque: scam.exemple_masque,
            signaux: Array.isArray(scam.signaux) ? scam.signaux : [],
            conduite_id: scam.conduite_id || "conduite_suspicion_generale",
            source: scam.source || "",
            date_source: scam.date_source || "",
          });
        }
      } catch {
        // Ignorer un fichier non lisible ou corrompu
      }
    }

    const N = parsedScams.length;
    if (N === 0) return;

    // Valeur IDF par défaut pour les termes hors corpus (df = 0)
    this.defaultIdf = Math.log(N + 1) + 1;

    // 1. Calcul des TF par document et des fréquences documentaires globales (DF)
    const docTfs: Map<string, number>[] = [];
    const dfMap = new Map<string, number>();

    for (const scam of parsedScams) {
      // Indexation conjointe de l'exemple masqué et du résumé
      const texteAIndexer = `${scam.exemple_masque} ${scam.resume}`;
      const texteNormalise = normalizeText(texteAIndexer);
      const tfMap = extractCharNgrams(texteNormalise, 3, 4);
      docTfs.push(tfMap);

      for (const gram of tfMap.keys()) {
        dfMap.set(gram, (dfMap.get(gram) || 0) + 1);
      }
    }

    // 2. Calcul de l'IDF lissé pour chaque n-gramme : ln((N + 1) / (DF + 1)) + 1
    for (const [gram, df] of dfMap.entries()) {
      const idf = Math.log((N + 1) / (df + 1)) + 1;
      this.idfMap.set(gram, idf);
    }

    // 3. Calcul des poids TF-IDF et de la norme euclidienne L2 de chaque document
    for (let i = 0; i < N; i++) {
      const scam = parsedScams[i];
      const tfMap = docTfs[i];
      const weights = new Map<string, number>();
      let sumSquares = 0;

      for (const [gram, tf] of tfMap.entries()) {
        const idf = this.idfMap.get(gram) || 1;
        const w = tf * idf;
        weights.set(gram, w);
        sumSquares += w * w;
      }

      this.documents.push({
        id: scam.id,
        resume: scam.resume,
        signaux: scam.signaux,
        weights,
        norm: Math.sqrt(sumSquares),
      });
    }
  }

  /**
   * Recherche les arnaques similaires par similarité cosinus sur vecteurs TF-IDF.
   *
   * @param texteMasque Texte à comparer
   * @param limit Nombre de résultats souhaités (défaut : 3)
   * @returns Liste des 3 plus proches si leur score dépasse le seuil significatif
   */
  public async retrieve(
    texteMasque: string,
    limit: number = 3
  ): Promise<ArnaqueProche[]> {
    this.ensureLoaded();

    if (!texteMasque || typeof texteMasque !== "string" || texteMasque.trim().length === 0) {
      return [];
    }

    if (this.documents.length === 0) {
      return [];
    }

    // Normalisation de la requête avec la même fonction que les règles
    const texteNormalise = normalizeText(texteMasque);
    const queryTf = extractCharNgrams(texteNormalise, 3, 4);
    const queryWeights = new Map<string, number>();
    let querySumSquares = 0;

    // Vectorisation de la requête : les termes inconnus reçoivent defaultIdf
    // pour que la norme reflète fidèlement la totalité des n-grammes de la requête
    for (const [gram, tf] of queryTf.entries()) {
      const idf = this.idfMap.get(gram) ?? this.defaultIdf;
      const w = tf * idf;
      queryWeights.set(gram, w);
      querySumSquares += w * w;
    }

    const queryNorm = Math.sqrt(querySumSquares);
    if (queryNorm === 0) {
      return [];
    }

    const matches: ArnaqueProche[] = [];

    for (const doc of this.documents) {
      if (doc.norm === 0) continue;

      let dotProduct = 0;
      // Produit scalaire sur l'intersection des n-grammes
      for (const [gram, qWeight] of queryWeights.entries()) {
        const dWeight = doc.weights.get(gram);
        if (dWeight !== undefined) {
          dotProduct += qWeight * dWeight;
        }
      }

      const cosine = dotProduct / (queryNorm * doc.norm);

      if (cosine >= SEUIL_SIMILARITE_MINIMALE) {
        matches.push({
          id: doc.id,
          score: Number(cosine.toFixed(3)),
          resume: doc.resume,
          signaux: doc.signaux,
        });
      }
    }

    // Tri par score de similarité décroissant
    matches.sort((a, b) => b.score - a.score);

    return matches.slice(0, Math.max(1, limit));
  }
}

// ---------------------------------------------------------------------------
// Singleton et point d'accès par défaut
// ---------------------------------------------------------------------------

let currentRetriever: ScamRetriever | null = null;

/**
 * Obtient l'instance active du système de recherche (singleton).
 */
export function getScamRetriever(): ScamRetriever {
  if (!currentRetriever) {
    currentRetriever = new LexicalTFIDFRetriever();
  }
  return currentRetriever;
}

/**
 * Permet d'injecter une implémentation alternative (ex: embeddings vectoriels).
 */
export function setScamRetriever(retriever: ScamRetriever): void {
  currentRetriever = retriever;
}

/**
 * Récupère les arnaques du corpus les plus proches sémantiquement ou lexicalement du texte analysé.
 *
 * @param texteMasque Le texte préalablement anonymisé
 * @param limit Nombre maximal de résultats à retourner (défaut : 3)
 * @returns Promesse contenant la liste des arnaques proches et leur score
 */
export async function retrieveSimilarScams(
  texteMasque: string,
  limit: number = 3
): Promise<ArnaqueProche[]> {
  return getScamRetriever().retrieve(texteMasque, limit);
}

// Initialisation au démarrage en production
if (process.env.NODE_ENV === "production") {
  try {
    const retriever = getScamRetriever();
    if (retriever instanceof LexicalTFIDFRetriever) {
      retriever.ensureLoaded();
    }
  } catch {
    // Échec de préchargement silencieux, se chargera au premier appel
  }
}
