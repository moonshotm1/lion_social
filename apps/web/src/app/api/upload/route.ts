import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export async function POST(req: NextRequest) {
  if (!supabaseUrl) {
    return Response.json({ error: "Storage not configured" }, { status: 503 });
  }

  // Verify the caller is authenticated
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate bucket name to prevent injection
  const requestedBucket = (formData.get("bucket") as string | null) ?? "posts";
  const allowedBuckets = ["posts", "avatars"] as const;
  type AllowedBucket = typeof allowedBuckets[number];
  const bucket: AllowedBucket = (allowedBuckets as readonly string[]).includes(requestedBucket)
    ? (requestedBucket as AllowedBucket)
    : "posts";

  // Use service role client so we can create buckets and bypass RLS.
  // Fall back to the user's session client if service role key isn't set.
  const storageClient = serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey)
    : supabase;

  // Ensure the bucket exists (only works with service role)
  if (serviceRoleKey) {
    const isImageOnly = bucket === "avatars";
    const { error: bucketError } = await storageClient.storage.createBucket(bucket, {
      public: true,
      allowedMimeTypes: isImageOnly ? ["image/*"] : ["image/*", "video/*"],
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    });
    if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
      console.error("[upload] Bucket creation failed:", bucketError.message);
    }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { data, error } = await storageClient.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "3600", upsert: bucket === "avatars" });

  if (error) {
    console.error("[upload] Upload failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from(bucket).getPublicUrl(data.path);

  return Response.json({ url: publicUrl });
}
