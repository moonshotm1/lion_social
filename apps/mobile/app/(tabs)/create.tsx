import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors, { PostTypeColors, PostTypeLabels } from "../../src/constants/colors";

type PostType = "workout" | "meal" | "quote" | "story";

const POST_TYPE_ICONS: Record<PostType, string> = {
  workout: "💪",
  meal: "🥗",
  quote: "💬",
  story: "📖",
};

const POST_TYPE_DESCRIPTIONS: Record<PostType, string> = {
  workout: "Share your training session",
  meal: "Show off your nutrition",
  quote: "Inspire the community",
  story: "Tell your journey",
};

export default function CreateScreen() {
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    // In production, use expo-image-picker:
    // const result = await ImagePicker.launchImageLibraryAsync({...});
    Alert.alert(
      "Image Picker",
      "Image picker would open here. Install expo-image-picker and run on a device to use this feature."
    );
  };

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert("Select a type", "Please choose a post type before sharing.");
      return;
    }
    if (!caption.trim()) {
      Alert.alert("Add a caption", "Write something to share with the community.");
      return;
    }

    Alert.alert(
      "Post Shared!",
      "Your post has been shared with the community.",
      [
        {
          text: "OK",
          onPress: () => {
            setSelectedType(null);
            setCaption("");
            setImageUri(null);
          },
        },
      ]
    );
  };

  const isValid = selectedType && caption.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={styles.headerSubtitle}>
            Share your journey with the pride
          </Text>
        </View>

        {/* Post Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>POST TYPE</Text>
          <View style={styles.typeGrid}>
            {(Object.keys(POST_TYPE_ICONS) as PostType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setSelectedType(type)}
                style={[
                  styles.typeCard,
                  selectedType === type && styles.typeCardActive,
                  selectedType === type && {
                    borderColor: PostTypeColors[type],
                    backgroundColor: `${PostTypeColors[type]}15`,
                  },
                ]}
              >
                <Text style={styles.typeIcon}>{POST_TYPE_ICONS[type]}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type && {
                      color: PostTypeColors[type],
                    },
                  ]}
                >
                  {PostTypeLabels[type]}
                </Text>
                <Text style={styles.typeDescription}>
                  {POST_TYPE_DESCRIPTIONS[type]}
                </Text>
                {selectedType === type && (
                  <View
                    style={[
                      styles.typeCheckmark,
                      { backgroundColor: PostTypeColors[type] },
                    ]}
                  >
                    <Text style={styles.typeCheckmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Image Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PHOTO (OPTIONAL)</Text>
          <Pressable onPress={handlePickImage} style={styles.imagePicker}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePickerContent}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>
                  Tap to add a photo
                </Text>
                <Text style={styles.imagePickerHint}>
                  JPG, PNG up to 10MB
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Caption Input */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAPTION</Text>
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind? Share your wins, lessons, or motivation..."
              placeholderTextColor={Colors.grayDark}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              textAlignVertical="top"
              selectionColor={Colors.gold}
            />
            <Text style={styles.charCount}>
              {caption.length}/500
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              !isValid && styles.submitButtonDisabled,
            ]}
            disabled={!isValid}
          >
            <Text
              style={[
                styles.submitButtonText,
                !isValid && styles.submitButtonTextDisabled,
              ]}
            >
              Share with the Pride
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.gray,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.gold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },

  // Type Selector
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  typeCard: {
    width: "47%",
    backgroundColor: Colors.dark800,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.dark700,
    position: "relative",
    overflow: "hidden",
  },
  typeCardActive: {
    borderWidth: 2,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 17,
  },
  typeCheckmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeCheckmarkText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },

  // Image Picker
  imagePicker: {
    height: 180,
    backgroundColor: Colors.dark800,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.dark700,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  imagePickerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerIcon: {
    fontSize: 40,
    opacity: 0.7,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.grayLight,
  },
  imagePickerHint: {
    fontSize: 12,
    color: Colors.grayDark,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },

  // Caption
  captionContainer: {
    backgroundColor: Colors.dark800,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark700,
    overflow: "hidden",
  },
  captionInput: {
    padding: 16,
    fontSize: 15,
    color: Colors.white,
    lineHeight: 22,
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: Colors.grayDark,
    textAlign: "right",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  // Submit
  submitContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitButton: {
    backgroundColor: Colors.gold,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark700,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.black,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  submitButtonTextDisabled: {
    color: Colors.grayDark,
  },
});
