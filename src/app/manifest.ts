import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MUST IPT Portal",
    short_name: "MUST IPT",
    description:
      "Industrial Practical Training Portal - Mbeya University of Science and Technology",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#7a1315",
    theme_color: "#7a1315",
    categories: ["education", "productivity"],
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcuts: [
      {
        name: "My Application",
        short_name: "Apply",
        url: "/student/apply",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Upload Weekly Report",
        short_name: "Report",
        url: "/student/report",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My Status",
        short_name: "Status",
        url: "/student/status",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
