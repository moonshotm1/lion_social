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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Colors, { PostTypeColors, PostTypeLabels } from "../../src/constants/colors";
import { supabase } from "../../src/lib/supabase";

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
  story: "Document your journey",
};

async function uploadImage(uri: string, userId: string): Promise<string | null> {
  try {
    const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${userId}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from("posts")
      .upload(filename, arrayBuffer, { contentType: `image/${ext}`, upsert: false });

    if (error) return null;

    const { data } = supabase.storage.from("posts").getPublicUrl(filename);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export default function CreateScreen() {
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library to add images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !caption.trim()) return;
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { Alert.alert("Not logged in", "Please sign in to post."); return; }

      const { data: appUser } = await supabase
        .from("User").select("id").eq("supabaseId", session.user.id).single();
      if (!appUser) { Alert.alert("Error", "Could not find your account."); return; }

      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, (appUser as any).id);
      }

      const now = new Date().toISOString();
      const postId = 'c' + Math.random().toString(36).substring(2, 26);
      const { error } = await supabase.from("Post").insert({
        id: postId,
        userId: (appUser as any).id,
        type: selectedType,
        caption: caption.trim(),
        imageUrl,
        createdAt: now,
        updatedAt: now,
      });

      if (error) {
        Alert.alert("Error", "Failed to share your post. Please try again.");
        return;
      }

      Alert.alert("Posted!", "Your post has been shared with the community.", [
        { text: "OK", onPress: () => { setSelectedType(null); setCaption(""); setImageUri(null); } },
      ]);
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = selectedType && caption.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Post</Text>
          <Text style={styles.headerSubtitle}>Share your journey with the community</Text>
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
                <Text style={[styles.typeLabel, selectedType === type && { color: PostTypeColors[type] }]}>
                  {PostTypeLabels[type]}
                </Text>
                <Text style={styles.typeDescription}>{POST_TYPE_DESCRIPTIONS[type]}</Text>
                {selectedType === type && (
                  <View style={[styles.typeCheckmark, { backgroundColor: PostTypeColors[type] }]}>
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
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                <Pressable style={styles.removeImage} onPress={() => setImageUri(null)}>
                  <Text style={styles.removeImageText}>✕</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.imagePickerContent}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>Tap to add a photo</Text>
                <Text style={styles.imagePickerHint}>JPG, PNG up to 10MB</Text>
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
            <Text style={styles.charCount}>{caption.length}/500</Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            onPress={handleSubmit}
            style={[styles.submitButton, (!isValid || submitting) && styles.submitButtonDisabled]}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
                Share Your Gains
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  scrollContent: { paddingBottom: 120 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.white, letterSpacing: 0.5, marginBottom: 4 },
  headerSubtitle: { fontSize: 15, color: Colors.gray },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: Colors.gold, letterSpacing: 1.5, marginBottom: 12 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  typeCard: {
    width: "47%", backgroundColor: Colors.dark800, borderRadius: 16,
    padding: 16, borderWidth: 1.5, borderColor: Colors.dark700,
    position: "relative", overflow: "hidden",
  },
  typeCardActive: { borderWidth: 2 },
  typeIcon: { fontSize: 32, marginBottom: 8 },
  typeLabel: { fontSize: 16, fontWeight: "700", color: Colors.white, marginBottom: 4 },
  typeDescription: { fontSize: 12, color: Colors.gray, lineHeight: 17 },
  typeCheckmark: {
    position: "absolute", top: 12, right: 12,
    width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  typeCheckmarkText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  imagePicker: {
    height: 180, backgroundColor: Colors.dark800, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.dark700, borderStyle: "dashed", overflow: "hidden",
  },
  imagePickerContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePickerIcon: { fontSize: 40, opacity: 0.7 },
  imagePickerText: { fontSize: 15, fontWeight: "600", color: Colors.grayLight },
  imagePickerHint: { fontSize: 12, color: Colors.grayDark },
  imagePreview: { width: "100%", height: "100%" },
  removeImage: {
    position: "absolute", top: 10, right: 10,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  removeImageText: { fontSize: 14, color: Colors.white, fontWeight: "700" },
  captionContainer: {
    backgroundColor: Colors.dark800, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.dark700, overflow: "hidden",
  },
  captionInput: { padding: 16, fontSize: 15, color: Colors.white, lineHeight: 22, minHeight: 140 },
  charCount: { fontSize: 12, color: Colors.grayDark, textAlign: "right", paddingHorizontal: 16, paddingBottom: 12 },
  submitContainer: { paddingHorizontal: 20, paddingTop: 8 },
  submitButton: {
    backgroundColor: Colors.gold, borderRadius: 16, paddingVertical: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  submitButtonDisabled: { backgroundColor: Colors.dark700, shadowOpacity: 0, elevation: 0 },
  submitButtonText: { fontSize: 16, fontWeight: "800", color: Colors.black, letterSpacing: 1, textTransform: "uppercase" },
  submitButtonTextDisabled: { color: Colors.grayDark },
});
