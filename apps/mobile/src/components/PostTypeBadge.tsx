import { View, Text, StyleSheet } from "react-native";
import { PostTypeColors, PostTypeLabels } from "../constants/colors";

interface PostTypeBadgeProps {
  type: string;
  size?: "small" | "default";
}

/**
 * Colored badge indicating the post type (workout, meal, quote, story).
 * Each type has a distinct color for quick visual identification.
 */
export default function PostTypeBadge({
  type,
  size = "default",
}: PostTypeBadgeProps) {
  const color = PostTypeColors[type] || "#888888";
  const label = PostTypeLabels[type] || type;
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.badge,
        isSmall && styles.badgeSmall,
        {
          backgroundColor: `${color}20`,
          borderColor: `${color}50`,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          { color },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 9,
    letterSpacing: 0.3,
  },
});
