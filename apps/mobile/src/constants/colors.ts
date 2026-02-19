/**
 * The Lion - Color Constants
 * Premium dark mode palette with gold accents
 */

export const Colors = {
  // Primary - Gold
  gold: "#D4A843",
  goldLight: "#E8C96A",
  goldDark: "#B8922F",
  goldMuted: "rgba(212, 168, 67, 0.15)",
  goldBorder: "rgba(212, 168, 67, 0.3)",

  // Backgrounds - Dark
  black: "#0A0A0A",
  dark900: "#111111",
  dark800: "#1A1A1A",
  dark700: "#2A2A2A",
  dark600: "#3A3A3A",
  dark500: "#4A4A4A",

  // Text
  white: "#F5F5F5",
  grayLight: "#CCCCCC",
  gray: "#888888",
  grayDark: "#555555",

  // Post Type Colors
  postWorkout: "#FF6B35",
  postMeal: "#4CAF50",
  postQuote: "#9C27B0",
  postStory: "#2196F3",

  // Semantic
  success: "#4CAF50",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",

  // Gradients (as arrays for LinearGradient)
  gradientGold: ["#D4A843", "#B8922F"] as const,
  gradientDark: ["#1A1A1A", "#0A0A0A"] as const,
  gradientCard: ["#1A1A1A", "#111111"] as const,
} as const;

export const PostTypeColors: Record<string, string> = {
  workout: Colors.postWorkout,
  meal: Colors.postMeal,
  quote: Colors.postQuote,
  story: Colors.postStory,
};

export const PostTypeLabels: Record<string, string> = {
  workout: "Workout",
  meal: "Meal",
  quote: "Quote",
  story: "Story",
};

export default Colors;
