import { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, Image, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Colors from "../src/constants/colors";
import Avatar from "../src/components/Avatar";
import { supabase } from "../src/lib/supabase";

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
}

async function uploadAvatar(uri: string, userId: string): Promise<string | null> {
  try {
    const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `${userId}/avatar.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filename, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filename);
    // Bust cache by appending timestamp
    return `${data.publicUrl}?t=${Date.now()}`;
  } catch {
    return null;
  }
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("User")
        .select("id, username, displayName, bio, avatarUrl")
        .eq("supabaseId", session.user.id)
        .single();
      if (data) {
        const p = data as any;
        setProfile({ id: p.id, username: p.username, displayName: p.displayName ?? "", bio: p.bio ?? "", avatarUrl: p.avatarUrl });
        setUsername(p.username ?? "");
        setDisplayName(p.displayName ?? "");
        setBio(p.bio ?? "");
      }
      setLoading(false);
    }
    load();
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!username.trim() || username.length < 3) {
      Alert.alert("Invalid username", "Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Invalid username", "Only letters, numbers, and underscores allowed.");
      return;
    }

    setSaving(true);
    try {
      // Check username availability if changed
      if (username.trim().toLowerCase() !== profile.username) {
        const { data: existing } = await supabase
          .from("User")
          .select("id")
          .eq("username", username.trim().toLowerCase())
          .maybeSingle();
        if (existing) {
          Alert.alert("Username taken", "That username is already in use.");
          return;
        }
      }

      // Upload new avatar if selected
      let avatarUrl = profile.avatarUrl;
      if (avatarUri) {
        setUploadingPhoto(true);
        const uploaded = await uploadAvatar(avatarUri, profile.id);
        setUploadingPhoto(false);
        if (uploaded) avatarUrl = uploaded;
        else Alert.alert("Photo upload failed", "Your other changes will still be saved.");
      }

      const { error } = await supabase
        .from("User")
        .update({
          username: username.trim().toLowerCase(),
          displayName: displayName.trim() || username.trim(),
          bio: bio.trim(),
          avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        Alert.alert("Save failed", error.message);
        return;
      }

      Alert.alert("Saved!", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const currentAvatar = avatarUri ?? profile?.avatarUrl ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable
            onPress={handleSave}
            style={[styles.headerBtn, styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.black} />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} style={styles.avatarImage} />
              ) : (
                <Avatar uri={null} name={displayName || username} size={96} />
              )}
              {uploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={Colors.white} />
                </View>
              )}
            </View>
            <Pressable onPress={handlePickPhoto} style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Change Profile Photo</Text>
            </Pressable>
          </View>

          {/* Logout */}
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              Alert.alert("Log Out", "Are you sure you want to log out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Log Out", style: "destructive", onPress: async () => { await supabase.auth.signOut(); } },
              ]);
            }}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          {/* Fields */}
          <View style={styles.fieldsSection}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <TextInput
                style={styles.fieldInput}
                value={username}
                onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="your_handle"
                placeholderTextColor={Colors.grayDark}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
                selectionColor={Colors.gold}
              />
              <Text style={styles.fieldHint}>Letters, numbers, and underscores only</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your Name"
                placeholderTextColor={Colors.grayDark}
                maxLength={50}
                selectionColor={Colors.gold}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>BIO</Text>
              <TextInput
                style={[styles.fieldInput, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell the community about yourself..."
                placeholderTextColor={Colors.grayDark}
                multiline
                maxLength={200}
                textAlignVertical="top"
                selectionColor={Colors.gold}
              />
              <Text style={styles.fieldHint}>{bio.length}/200</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  flex: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: Colors.dark800,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.white },
  cancelText: { fontSize: 16, color: Colors.gray },
  saveBtn: {
    backgroundColor: Colors.gold, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6, alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { fontSize: 15, fontWeight: "700", color: Colors.black },

  scrollContent: { paddingBottom: 60 },

  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatarRing: {
    width: 102, height: 102, borderRadius: 51,
    borderWidth: 2, borderColor: Colors.gold,
    alignItems: "center", justifyContent: "center",
    overflow: "hidden", position: "relative",
  },
  avatarImage: { width: 98, height: 98, borderRadius: 49 },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },
  changePhotoBtn: { marginTop: 12 },
  changePhotoText: { fontSize: 16, fontWeight: "600", color: Colors.gold },

  logoutBtn: {
    marginHorizontal: 20, marginBottom: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.error,
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "700", color: Colors.error },
  fieldsSection: { paddingHorizontal: 20 },
  field: { marginBottom: 24 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: Colors.gold, letterSpacing: 1.5, marginBottom: 8 },
  fieldInput: {
    backgroundColor: Colors.dark800, borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 14, fontSize: 15, color: Colors.white,
    borderWidth: 1, borderColor: Colors.dark700,
  },
  bioInput: { minHeight: 100, paddingTop: 14 },
  fieldHint: { fontSize: 12, color: Colors.grayDark, marginTop: 6 },
});
