import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Colors from "../../src/constants/colors";
import { supabase } from "../../src/lib/supabase";

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createUserRecord(supabaseId: string, username: string, displayName: string, email: string) {
  // Check if record already exists (e.g. retry scenario)
  const { data: existing } = await supabase
    .from("User")
    .select("id")
    .eq("supabaseId", supabaseId)
    .maybeSingle();

  if (existing) return; // Already created

  const now = new Date().toISOString();
  await supabase.from("User").insert({
    supabaseId,
    username,
    displayName,
    email,
    inviteCode: generateInviteCode(),
    createdAt: now,
    updatedAt: now,
  });
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const [status, setStatus] = useState("Confirming your account…");

  useEffect(() => {
    async function handleCallback(url: string) {
      try {
        // Extract the code from the URL query params
        const parsed = Linking.parse(url);
        const code = parsed.queryParams?.code as string | undefined;

        if (!code) {
          setStatus("Invalid confirmation link.");
          setTimeout(() => router.replace("/(auth)/sign-in"), 2000);
          return;
        }

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.session) {
          setStatus("Confirmation failed. Please try again.");
          setTimeout(() => router.replace("/(auth)/sign-in"), 2000);
          return;
        }

        // Create the User record using metadata stored at sign-up time
        const user = data.session.user;
        const username = (user.user_metadata?.username as string) ?? user.email?.split("@")[0] ?? "user";
        const displayName = (user.user_metadata?.displayName as string) ?? username;
        const email = user.email ?? "";

        setStatus("Setting up your profile…");
        await createUserRecord(user.id, username, displayName, email);

        // AuthGate will handle navigation to tabs
        router.replace("/(tabs)");
      } catch {
        setStatus("Something went wrong. Please sign in manually.");
        setTimeout(() => router.replace("/(auth)/sign-in"), 2000);
      }
    }

    // Get the URL that opened the app
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleCallback(url);
      } else {
        router.replace("/(auth)/sign-in");
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.black,
    alignItems: "center", justifyContent: "center", gap: 20,
  },
  status: { fontSize: 16, color: Colors.gray, textAlign: "center", paddingHorizontal: 32 },
});
