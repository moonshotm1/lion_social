import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gains | Wellness Social",
    short_name: "Gains",
    description:
      "Elevate your wellness journey. Share workouts, meals, and motivation with a community that pushes you to be your best.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0D0D0D",
    orientation: "portrait",
    categories: ["health", "fitness", "social"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
