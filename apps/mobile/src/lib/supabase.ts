import { createClient } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system";

/**
 * Supabase client for Gains mobile app.
 *
 * In production, set these values via environment variables
 * or Expo's app.config.js extra field.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

/**
 * Custom storage adapter for React Native using expo-file-system.
 * Supabase uses this for persisting auth sessions.
 */
const ExpoFileSystemStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const path = `${FileSystem.documentDirectory}supabase-${key}`;
      const info = await FileSystem.getInfoAsync(path);
      if (!info.exists) return null;
      return await FileSystem.readAsStringAsync(path);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const path = `${FileSystem.documentDirectory}supabase-${key}`;
      await FileSystem.writeAsStringAsync(path, value);
    } catch {
      // Silent fail - auth will still work, just won't persist
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      const path = `${FileSystem.documentDirectory}supabase-${key}`;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
      }
    } catch {
      // Silent fail
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoFileSystemStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
