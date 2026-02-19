import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  if (!supabase) {
    console.warn("[Demo Mode] File upload simulated");
    return URL.createObjectURL(file);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  if (!supabase) {
    console.warn("[Demo Mode] File delete simulated");
    return true;
  }

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!supabase) {
    console.warn("[Demo Mode] Signed URL simulated");
    return null;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error("Signed URL error:", error);
    return null;
  }

  return data.signedUrl;
}
