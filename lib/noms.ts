import { MOTS_DES_MARQUEURS } from "./marqueurs";

/**
 * Masquage des noms de personnes : dictionnaire de noms courants + indices de contexte.
 * Masquage au mieux, non garanti : un nom rare, sans indice autour, peut passer.
 */

const normaliser = (s: string): string =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const ensemble = (liste: string[]): Set<string> => new Set(liste.map(normaliser));

const PRENOMS = ensemble([
  "Moussa", "Awa", "Cheikh", "Ibrahima", "Ibrahim", "Mamadou", "Aminata", "Ousmane",
  "Babacar", "Khady", "Mariama", "Modou", "Ndeye", "Coumba", "Pape", "Serigne",
  "Rokhaya", "Alioune", "Badara", "Seynabou", "Astou", "Lamine", "Fatou", "Fatoumata",
  "Fatima", "Binta", "Bintou", "Aissatou", "Aicha", "Aida", "Adama", "Abdoulaye",
  "Abdou", "Abdoul", "Abdourahmane", "Amadou", "Assane", "Boubacar", "Daouda", "Demba",
  "Djibril", "Elhadji", "Hadji", "Habib", "Idrissa", "Issa", "Insa", "Mactar", "Malick",
  "Mansour", "Mame", "Mor", "Moustapha", "Mouhamed", "Mouhammed", "Mohamed", "Omar",
  "Oumar", "Ousseynou", "Samba", "Saliou", "Sidy", "Souleymane", "Tidiane", "Thierno",
  "Yacine", "Yaye", "Penda", "Rama", "Ramatoulaye", "Safiatou", "Sokhna", "Maimouna",
  "Marieme", "Nafissatou", "Dieynaba", "Gora", "Ablaye", "Alassane", "Anta", "Arame",
  "Bineta", "Binetou", "Codou", "Fama", "Fanta", "Khadija", "Khadidiatou", "Kadiatou",
  "Magatte", "Massamba", "Ndiaga", "Ndiogou", "Seydou", "Seydina", "Talla",
]);

const NOMS = ensemble([
  "Diop", "Ndiaye", "Fall", "Ba", "Sow", "Diallo", "Gueye", "Faye", "Thiam", "Seck",
  "Mbaye", "Diouf", "Cissé", "Kane", "Ndour", "Sarr", "Sy", "Niang", "Camara", "Sène",
  "Samb", "Ndao", "Wade", "Tall", "Dione", "Badji", "Sagna", "Diatta", "Coly", "Mendy",
  "Ka", "Kébé", "Touré", "Traoré", "Cissokho", "Konaté", "Keita", "Diagne", "Diakhaté",
  "Dieng", "Diaw", "Lo", "Mbodj", "Mboup", "Ndong", "Ndiongue", "Gning", "Gaye", "Loum",
  "Mané", "Manga", "Pouye", "Sall", "Sané", "Sylla", "Thioune", "Thiaw", "Bousso",
  "Boye", "Bop", "Beye", "Dabo", "Dramé", "Fofana", "Goudiaby", "Sakho", "Sonko",
  "Sidibé", "Tounkara", "Wane", "Yade", "Ngom",
]);

/** Noms de 1 à 2 lettres : masqués seulement à côté d'un autre nom (ex. « Mamadou Ba »). */
const NOMS_COURTS = new Set([...NOMS].filter((n) => n.length <= 2));

/** Mots qui précèdent souvent un nom propre (« Bonjour Awa », « Mme Sow »). */
const INDICES_MOT = ensemble([
  "Mr", "M", "Mme", "Mlle", "Monsieur", "Madame", "Mademoiselle", "Cher", "Chère",
  "Bonjour", "Bonsoir", "Salut", "Allô", "Tonton", "Tata", "Oncle", "Tante", "Frère",
  "Soeur", "Docteur", "Dr",
]);

/** Expressions qui précèdent souvent un nom propre (comparées sans accents). */
const INDICES_EXPRESSION: string[][] = [
  ["de", "la", "part", "de"],
  ["envoye", "par"],
  ["envoye", "a"],
  ["recu", "de"],
  ["recu", "par"],
  ["transfert", "de"],
  ["transfert", "a"],
  ["transfere", "a"],
  ["paye", "a"],
  ["beneficiaire"],
  ["je", "suis"],
  ["c", "est"],
  ["je", "m", "appelle"],
  ["mon", "nom", "est"],
];

/** Mots capitalisés à ne jamais masquer : opérateurs, villes, mots du message, marqueurs. */
const A_NE_PAS_MASQUER = ensemble([
  "Wave", "Orange", "Money", "Free", "OM", "Sonatel", "Senelec", "Sénégal", "Dakar",
  "Thiès", "Touba", "Kaolack", "Saint", "Louis", "Ziguinchor", "Mbour", "Rufisque",
  "Pikine", "Guédiawaye", "Diourbel", "Louga", "Tambacounda", "Kolda", "Fatick",
  "Kaffrine", "Kédougou", "Matam", "Sédhiou", "Client", "Cliente", "Abonné", "Abonnée",
  "Utilisateur", "Service", "Compte", "Votre", "Notre", "Merci", "Cordialement",
  "Félicitations", "Urgent", "Attention", "Alerte", "Message", "Transfert", "Code",
  "Numéro", "Montant", "Lien", "Nom", "Agent", "Conseiller", "Technicien", "Responsable",
  "Directeur", "Inspecteur", "Commandant", "Lieutenant", "Officier", "Huissier", "Police",
  "Gendarmerie", "Banque", "Opérateur", "Désolé", "Désolée", "Bonne",
  "Je", "Tu", "Il", "Elle", "Nous", "Vous", "On", "Le", "La", "Les", "Un", "Une", "Des", "Et",
  "Ou", "Mais", "Pour", "Si", "Sur", "Dans", "Avec", ...MOTS_DES_MARQUEURS,
]);

const MOT = /([A-Za-zÀ-ÖØ-öø-ÿ]+)/;
const COMMENCE_PAR_MAJUSCULE = /^[A-ZÀ-ÖØ-Þ]/;

/**
 * Remplace les noms de personnes par `marqueur`. Les noms collés (« Ndeye Coumba Thiam »)
 * donnent un seul marqueur.
 */
export function masquerNoms(texte: string, marqueur: string): string {
  // split avec groupe capturant : indices pairs = séparateurs, impairs = mots
  const morceaux = texte.split(MOT);
  const positions: number[] = [];
  for (let k = 1; k < morceaux.length; k += 2) positions.push(k);

  const norm = positions.map((k) => normaliser(morceaux[k]));
  const majuscule = positions.map((k) => COMMENCE_PAR_MAJUSCULE.test(morceaux[k]));
  const masque: boolean[] = positions.map(() => false);

  // a et b sont deux mots consécutifs : « collés » = séparés par des espaces seulement
  const colles = (a: number, b: number): boolean =>
    a >= 0 && b < positions.length && /^[ \t]+$/.test(morceaux[positions[a] + 1] ?? "");

  // 1. Noms du dictionnaire (hors noms courts)
  for (let p = 0; p < positions.length; p++) {
    if (!majuscule[p]) continue;
    const n = norm[p];
    if (PRENOMS.has(n) || (NOMS.has(n) && !NOMS_COURTS.has(n))) masque[p] = true;
  }

  // 2. Noms courts (Ba, Sy, Ka, Lo) : seulement à côté d'un nom déjà repéré
  for (let p = 0; p < positions.length; p++) {
    if (!majuscule[p] || !NOMS_COURTS.has(norm[p]) || masque[p]) continue;
    const apresPrenom = colles(p - 1, p) && masque[p - 1];
    const avantNom = colles(p, p + 1) && masque[p + 1];
    if (apresPrenom || avantNom) masque[p] = true;
  }

  // 3. Indices de contexte : un mot capitalisé inconnu après « Bonjour », « envoyé par »...
  const apresIndice = (p: number): boolean => {
    if (p === 0) return false;
    if (INDICES_MOT.has(norm[p - 1])) return true;
    return INDICES_EXPRESSION.some((expr) => {
      if (p < expr.length) return false;
      return expr.every((mot, i) => norm[p - expr.length + i] === mot);
    });
  };
  for (let p = 0; p < positions.length; p++) {
    const candidat = (q: number): boolean =>
      majuscule[q] && !A_NE_PAS_MASQUER.has(norm[q]) && !INDICES_MOT.has(norm[q]);
    if (masque[p] || !candidat(p) || !apresIndice(p)) continue;
    masque[p] = true;
    // jusqu'à 2 mots capitalisés collés derrière (nom de famille, second prénom)
    for (let q = p + 1; q <= p + 2 && colles(q - 1, q) && candidat(q); q++) masque[q] = true;
  }

  // 3b. Nom de famille inconnu collé derrière un prénom du dictionnaire (« Binta Gadiaga »)
  for (let p = 0; p < positions.length - 1; p++) {
    const q = p + 1;
    if (!masque[p] || masque[q] || !PRENOMS.has(norm[p]) || !colles(p, q)) continue;
    if (majuscule[q] && !A_NE_PAS_MASQUER.has(norm[q]) && !INDICES_MOT.has(norm[q])) masque[q] = true;
  }

  // 4. Reconstruction en fusionnant les marqueurs voisins
  let sortie = "";
  let separateurEnAttente = "";
  let dernierEtaitMarqueur = false;
  for (let k = 0; k < morceaux.length; k++) {
    if (k % 2 === 0) {
      if (dernierEtaitMarqueur) separateurEnAttente += morceaux[k];
      else sortie += morceaux[k];
      continue;
    }
    const estMasque = masque[(k - 1) / 2];
    if (estMasque) {
      if (dernierEtaitMarqueur && /^[\s-]*$/.test(separateurEnAttente)) {
        separateurEnAttente = "";
      } else {
        sortie += separateurEnAttente + marqueur;
        separateurEnAttente = "";
      }
      dernierEtaitMarqueur = true;
    } else {
      sortie += separateurEnAttente + morceaux[k];
      separateurEnAttente = "";
      dernierEtaitMarqueur = false;
    }
  }
  return sortie + separateurEnAttente;
}
