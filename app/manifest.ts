import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PitCare Auto - Sistem Manajemen Bengkel",
    short_name: "PitCare Auto",
    description: "Aplikasi manajemen operasional bengkel motor & mobil, antrean servis, dan suku cadang.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0F172A",
    theme_color: "#4F46E5",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
