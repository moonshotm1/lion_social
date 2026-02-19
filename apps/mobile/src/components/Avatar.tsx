import { View, Text, Image, StyleSheet } from "react-native";
import Colors from "../constants/colors";

interface AvatarProps {
  uri: string | null;
  name: string;
  size?: number;
}

/**
 * Avatar component with image or initials fallback.
 * Uses the gold accent color for the initials background.
 */
export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const borderRadius = size / 2;
  const fontSize = size * 0.36;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.dark700,
  },
  fallback: {
    backgroundColor: Colors.goldMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  initials: {
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 1,
  },
});
