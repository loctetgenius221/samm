import type { ImageInput, OcrEngine } from "./index";

/**
 * Moteur OCR basé sur Tesseract.
 * Stub d'implémentation respectant le contrat OcrEngine.
 */
export class TesseractEngine implements OcrEngine {
  /**
   * Extrait le texte d'une image via Tesseract.
   * 
   * @param image Données de l'image
   * @returns Promesse contenant le texte extrait
   */
  async readText(image: ImageInput): Promise<string> {
    void image;
    // TODO: Initialiser tesseract.js ou le binaire Tesseract
    // TODO: Configurer la reconnaissance optique (langues : français, wolof)
    return "";
  }
}

/**
 * Fonction autonome d'extraction OCR via Tesseract.
 */
export async function readTextWithTesseract(image: ImageInput): Promise<string> {
  const engine = new TesseractEngine();
  return engine.readText(image);
}
