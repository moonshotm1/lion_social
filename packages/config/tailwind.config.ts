import type { Config } from "tailwindcss";

const lionConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        lion: {
          gold: "#D4A843",
          "gold-light": "#E8C96A",
          "gold-dark": "#B8902E",
          black: "#0A0A0A",
          "dark-1": "#111111",
          "dark-2": "#1A1A1A",
          "dark-3": "#242424",
          "dark-4": "#2E2E2E",
          gray: "#888888",
          "gray-light": "#AAAAAA",
          white: "#F5F5F5",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lion: "12px",
      },
    },
  },
};

export default lionConfig;
