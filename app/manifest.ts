import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sàmm",
    short_name: "Sàmm",
    description: "Vérifiez un message suspect avant d'envoyer de l'argent ou un code.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5fa",
    theme_color: "#f4f5fa",
    lang: "fr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
