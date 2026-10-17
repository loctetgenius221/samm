/**
 * Module OCR pour l'extraction de texte à partir d'images ou captures d'écran.
 */

/**
 * Type d'entrée supporté pour l'image (Blob, Buffer ou chemin de fichier).
 */
export type ImageInput = Blob | Buffer | string;

/**
 * Interface pour les moteurs d'extraction OCR.
 */
export interface OcrEngine {
  readText(image: ImageInput): Promise<string>;
}

/**
 * Fonction principale d'extraction de texte depuis une image.
 * 
 * @param image Données de l'image ou capture d'écran
 * @returns Promesse contenant le texte brut extrait
 */
export async function readText(image: ImageInput): Promise<string> {
  void image;
  // TODO: Sélectionner et orchestrer le moteur OCR actif (ex: Tesseract ou Paddle)
  // TODO: Renvoyer le texte extrait sans modifier la sémantique
  return "";
}
