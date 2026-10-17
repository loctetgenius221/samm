import type { ImageInput, OcrEngine } from "./index";

/**
 * Moteur OCR basé sur PaddleOCR.
 * Stub d'implémentation levant explicitement une erreur selon les spécifications.
 */
export class PaddleEngine implements OcrEngine {
  /**
   * Tente d'extraire le texte d'une image via PaddleOCR.
   * 
   * @throws Erreur « non implémenté »
   */
  async readText(image: ImageInput): Promise<string> {
    void image;
    // TODO: Implémenter l'intégration PaddleOCR ultérieurement
    throw new Error("non implémenté");
  }
}

/**
 * Fonction autonome d'extraction OCR via PaddleOCR.
 */
export async function readTextWithPaddle(image: ImageInput): Promise<string> {
  const engine = new PaddleEngine();
  return engine.readText(image);
}
