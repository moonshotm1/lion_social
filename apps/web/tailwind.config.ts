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
          gold: "#F5C842",
          "gold-light": "#F9D96E",
          "gold-dark": "#C8921A",
          "gold-muted": "rgba(245, 200, 66, 0.15)",
          black: "#080808",
          "dark-1": "#0D0D0D",
          "dark-2": "#161616",
          "dark-3": "#1E1E1E",
          "dark-4": "#222222",
          "gray-1": "#333333",
          "gray-2": "#444444",
          "gray-3": "#666666",
          "gray-4": "#888888",
          "gray-5": "#f0f0f0",
          white: "#f0f0f0",
        },
        gains: {
          green: "#5CB85C",
          purple: "#9B8FFF",
          orange: "#FF8C5A",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F5C842 0%, #F9D96E 50%, #C8921A 100%)",
        "dark-gradient": "linear-gradient(180deg, #080808 0%, #0D0D0D 100%)",
        "card-gradient": "linear-gradient(135deg, #161616 0%, #0D0D0D 100%)",
      },
      boxShadow: {
        "gold-sm": "0 1px 3px rgba(245, 200, 66, 0.15)",
        "gold-md": "0 4px 12px rgba(245, 200, 66, 0.2)",
        "gold-lg": "0 8px 24px rgba(245, 200, 66, 0.28)",
        "gold-glow": "0 0 24px rgba(245, 200, 66, 0.4)",
        "dark-sm": "0 1px 3px rgba(0, 0, 0, 0.4)",
        "dark-md": "0 4px 12px rgba(0, 0, 0, 0.5)",
        "dark-lg": "0 8px 24px rgba(0, 0, 0, 0.65)",
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
