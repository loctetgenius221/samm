// Génération d'une carte image PNG pour le partage d'alerte Sàmm.
import type { ResultatAffichage } from "@/components/ResultZone";
import type { NiveauAlerte } from "@/lib/types";

export const STYLES_VERDICT: Record<
  NiveauAlerte,
  { titre: string; consigne: string; fond: string; texte: string; iconeTexte: string }
> = {
  danger: {
    titre: "DANGER",
    consigne: "C'est très probablement une arnaque. Ne répondez pas, n'envoyez ni argent ni code.",
    fond: "#C4231A",
    texte: "#FFFFFF",
    iconeTexte: "⚠",
  },
  suspect: {
    titre: "SUSPECT",
    consigne: "Ne faites rien avant d'avoir vérifié auprès de votre opérateur.",
    fond: "#F2A900",
    texte: "#241A00",
    iconeTexte: "⚡",
  },
  aucun_signal: {
    titre: "AUCUN SIGNAL DÉTECTÉ",
    consigne: "Sàmm n'a rien repéré, mais aucun outil ne garantit qu'un message est sans risque.",
    fond: "#E3E7F0",
    texte: "#1C1E42",
    iconeTexte: "ℹ",
  },
};

// Formate le texte d'accompagnement pour le partage sur les réseaux et messageries.
export function construireTextePartage(titre: string, signaux: string[], urlOrigine: string): string {
  const listeSignaux = signaux.length > 0 ? signaux.join(", ") : "aucun signal direct";
  return `Sàmm a classé un message comme « ${titre} » : ${listeSignaux}. Vérifiez vos messages suspects sur ${urlOrigine}`;
}

// Trace un rectangle arrondi sur le contexte Canvas 2D avec gestion de repli.
function dessinerRectangleArrondi(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Découpe un texte en lignes adaptées à la largeur maximale du conteneur.
function decouperTexte(ctx: CanvasRenderingContext2D, texte: string, largeurMax: number): string[] {
  const mots = texte.split(" ");
  const lignes: string[] = [];
  let ligneCourante = "";

  for (const mot of mots) {
    const testLigne = ligneCourante ? `${ligneCourante} ${mot}` : mot;
    const mesure = ctx.measureText(testLigne).width;
    if (mesure > largeurMax && ligneCourante) {
      lignes.push(ligneCourante);
      ligneCourante = mot;
    } else {
      ligneCourante = testLigne;
    }
  }
  if (ligneCourante) lignes.push(ligneCourante);
  return lignes;
}

// Dessine le logo vectoriel officiel de Sàmm à l'échelle demandée.
function dessinerLogo(ctx: CanvasRenderingContext2D, x: number, y: number, taille: number): void {
  const echelle = taille / 64;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(echelle, echelle);

  ctx.fillStyle = "#2D2F8F";
  dessinerRectangleArrondi(ctx, 0, 0, 64, 64, 16);
  ctx.fill();

  ctx.strokeStyle = "#F2A900";
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(32, 6.5);
  ctx.lineTo(52, 13.5);
  ctx.lineTo(52, 29);
  ctx.bezierCurveTo(52, 42, 43.5, 51.5, 32, 56.5);
  ctx.bezierCurveTo(20.5, 51.5, 12, 42, 12, 29);
  ctx.lineTo(12, 13.5);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(25, 18);
  ctx.lineTo(39, 18);
  ctx.arcTo(46, 18, 46, 25, 7);
  ctx.lineTo(46, 29);
  ctx.arcTo(46, 36, 39, 36, 7);
  ctx.lineTo(31, 36);
  ctx.lineTo(24, 41.5);
  ctx.lineTo(25.1, 35.5);
  ctx.arcTo(18, 36, 18, 29, 7);
  ctx.lineTo(18, 25);
  ctx.arcTo(18, 18, 25, 18, 7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2D2F8F";
  for (const cx of [25.5, 32, 38.5]) {
    ctx.beginPath();
    ctx.arc(cx, 27, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/** Construit un canvas avec la carte d'alerte stylisée en résolution 1080x1080. */
export function genererCarteAlerteCanvas(resultat: ResultatAffichage, urlOrigine: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Contexte Canvas 2D non disponible");

  const conf = STYLES_VERDICT[resultat.niveau];
  const police = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // 1. Fond général
  ctx.fillStyle = "#F4F5FA";
  ctx.fillRect(0, 0, 1080, 1080);

  // 2. En-tête : Logo + Sàmm + Mission
  dessinerLogo(ctx, 70, 60, 72);

  ctx.fillStyle = "#1C1E42";
  ctx.font = `800 44px ${police}`;
  ctx.fillText("Sàmm", 160, 104);

  ctx.fillStyle = "#555874";
  ctx.font = `600 22px ${police}`;
  ctx.fillText("Détecteur d'arnaques mobile money au Sénégal", 160, 134);

  // 3. Carte Verdict
  ctx.fillStyle = conf.fond;
  dessinerRectangleArrondi(ctx, 70, 160, 940, 320, 32);
  ctx.fill();

  ctx.fillStyle = conf.texte;
  ctx.font = `800 56px ${police}`;
  ctx.fillText(`${conf.iconeTexte}  ${conf.titre}`, 110, 246);

  ctx.font = `600 30px ${police}`;
  const lignesConsigne = decouperTexte(ctx, conf.consigne, 860);
  let yConsigne = 310;
  for (const ligne of lignesConsigne) {
    ctx.fillText(ligne, 110, yConsigne);
    yConsigne += 44;
  }

  // 4. Carte Signaux
  ctx.fillStyle = "#FFFFFF";
  dessinerRectangleArrondi(ctx, 70, 510, 940, 420, 32);
  ctx.fill();
  ctx.strokeStyle = "#DCDFEB";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#1C1E42";
  ctx.font = `800 30px ${police}`;
  ctx.fillText("Signaux identifiés", 110, 568);

  const signaux = resultat.signaux.length > 0 ? resultat.signaux : ["Aucun signal d'arnaque direct détecté."];
  let ySignal = 630;
  ctx.font = `700 26px ${police}`;

  for (const signal of signaux.slice(0, 3)) {
    ctx.fillStyle = "#2D2F8F";
    ctx.beginPath();
    ctx.arc(122, ySignal - 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#1C1E42";
    const lignesSignal = decouperTexte(ctx, signal, 820);
    for (const ligne of lignesSignal) {
      ctx.fillText(ligne, 145, ySignal);
      ySignal += 38;
    }
    ySignal += 16;
  }

  // 5. Pied de page
  const domaine = urlOrigine.replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.fillStyle = "#555874";
  ctx.font = `600 22px ${police}`;
  ctx.textAlign = "center";
  ctx.fillText("Vérifiez gratuitement vos messages suspects sur", 540, 985);

  ctx.fillStyle = "#2D2F8F";
  ctx.font = `800 30px ${police}`;
  ctx.fillText(domaine || "samm.sn", 540, 1025);

  return canvas;
}

/** Génère un Blob PNG de la carte d'alerte. */
export async function genererCarteAlerteBlob(
  resultat: ResultatAffichage,
  urlOrigine: string
): Promise<Blob> {
  const canvas = genererCarteAlerteCanvas(resultat, urlOrigine);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Impossible de générer le blob image"));
    }, "image/png");
  });
}

/** Télécharge le fichier image sur le poste de l'utilisateur. */
export function telechargerImage(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Partage l'alerte sous forme d'image (via Web Share API sur mobile ou téléchargement + WhatsApp sur desktop). */
export async function partagerAlerte(resultat: ResultatAffichage): Promise<void> {
  const origine = typeof window !== "undefined" ? window.location.origin : "https://samm.sn";
  const verdict = STYLES_VERDICT[resultat.niveau];
  const texte = construireTextePartage(verdict.titre, resultat.signaux, origine);
  const nomFichier = `samm-alerte-${resultat.niveau}.png`;

  try {
    const blob = await genererCarteAlerteBlob(resultat, origine);
    const fichier = new File([blob], nomFichier, { type: "image/png" });

    // Si le navigateur permet de partager directement des fichiers (smartphones / WhatsApp)
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [fichier] })) {
      await navigator.share({
        title: `Alerte Sàmm : ${verdict.titre}`,
        text: texte,
        files: [fichier],
      });
      return;
    }

    // Fallback : télécharge l'image générée et ouvre WhatsApp
    telechargerImage(blob, nomFichier);
  } catch (erreur) {
    console.error("Échec génération ou partage image", erreur);
  }

  // Si navigator.share natif textuel est disponible
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ text: texte }).catch(() => undefined);
    return;
  }

  // Fallback web WhatsApp
  window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, "_blank", "noopener");
}
