/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lion: {
          gold: "#D4A843",
          "gold-light": "#E8C96A",
          "gold-dark": "#B8922F",
          "gold-muted": "rgba(212, 168, 67, 0.15)",
          black: "#0A0A0A",
          "dark-900": "#111111",
          "dark-800": "#1A1A1A",
          "dark-700": "#2A2A2A",
          "dark-600": "#3A3A3A",
          "dark-500": "#4A4A4A",
          white: "#F5F5F5",
          "gray-light": "#CCCCCC",
          gray: "#888888",
          "gray-dark": "#555555",
        },
        post: {
          workout: "#FF6B35",
          meal: "#4CAF50",
          quote: "#9C27B0",
          story: "#2196F3",
        },
      },
      fontFamily: {
        sans: ["System"],
        heading: ["System"],
      },
    },
  },
  plugins: [],
};
