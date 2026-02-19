import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        lion: {
          gold: "#D4A843",
          "gold-light": "#E8C76A",
          "gold-dark": "#B8912E",
          "gold-muted": "rgba(212, 168, 67, 0.15)",
          black: "#0A0A0A",
          "dark-1": "#111111",
          "dark-2": "#1A1A1A",
          "dark-3": "#222222",
          "dark-4": "#2A2A2A",
          "gray-1": "#333333",
          "gray-2": "#555555",
          "gray-3": "#888888",
          "gray-4": "#AAAAAA",
          "gray-5": "#CCCCCC",
          white: "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #D4A843 0%, #E8C76A 50%, #B8912E 100%)",
        "dark-gradient": "linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
        "card-gradient": "linear-gradient(135deg, #1A1A1A 0%, #111111 100%)",
      },
      boxShadow: {
        "gold-sm": "0 1px 3px rgba(212, 168, 67, 0.12)",
        "gold-md": "0 4px 12px rgba(212, 168, 67, 0.15)",
        "gold-lg": "0 8px 24px rgba(212, 168, 67, 0.2)",
        "gold-glow": "0 0 20px rgba(212, 168, 67, 0.3)",
        "dark-sm": "0 1px 3px rgba(0, 0, 0, 0.3)",
        "dark-md": "0 4px 12px rgba(0, 0, 0, 0.4)",
        "dark-lg": "0 8px 24px rgba(0, 0, 0, 0.5)",
      },
      animation: {
        "pulse-gold": "pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
