import type { Worker } from "tesseract.js";

const LARGEUR_MINIMALE = 1500;

let worker: Promise<Worker> | undefined;

const obtenirWorker = (): Promise<Worker> =>
  (worker ??= import("tesseract.js").then(({ createWorker }) => createWorker("fra")));

async function pretraiter(image: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(image);
  const echelle = Math.max(1, LARGEUR_MINIMALE / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * echelle);
  canvas.height = Math.round(bitmap.height * echelle);

  const contexte = canvas.getContext("2d");
  if (!contexte) throw new Error("Canvas 2D indisponible");
  // Ignoré par les navigateurs sans ctx.filter : Tesseract binarise de toute façon.
  contexte.filter = "grayscale(1)";
  contexte.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

export async function readText(image: Blob): Promise<string> {
  const { data } = await (await obtenirWorker()).recognize(await pretraiter(image));
  return data.text.trim();
}
