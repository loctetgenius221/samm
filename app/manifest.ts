import type { MetadataRoute } from "next";

/**
 * Manifeste PWA de Sàmm généré nativement par Next.js.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sàmm",
    short_name: "Sàmm",
    description: "Protection et repérage des arnaques mobile money au Sénégal",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "fr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
