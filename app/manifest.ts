import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WheelDraw — Tirages au sort multi-cycles",
    short_name: "WheelDraw",
    description: "Tirages au sort multi-cycles avec roue de la fortune animée",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a1a",
    theme_color: "#0a0a1a",
    categories: ["productivity", "utilities", "entertainment"],
    lang: "fr",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
