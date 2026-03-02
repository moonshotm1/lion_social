export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/avi",
  "video/webm",
]);

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

    if (!supabaseUrl) {
      return Response.json({ error: "Storage not configured" }, { status: 503 });
    }

    // Verify the caller is authenticated
    const { createSupabaseServerClient } = await import("@/lib/supabase");
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
    type AllowedBucket = (typeof allowedBuckets)[number];
    const bucket: AllowedBucket = (allowedBuckets as readonly string[]).includes(requestedBucket)
      ? (requestedBucket as AllowedBucket)
      : "posts";

    // Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    const isImage = IMAGE_MIME_TYPES.has(mimeType);
    const isVideo = VIDEO_MIME_TYPES.has(mimeType);

    if (bucket === "avatars" && !isImage) {
      return Response.json({ error: "Avatars must be image files (jpg, png, webp, gif)" }, { status: 400 });
    }
    if (bucket === "posts" && !isImage && !isVideo) {
      return Response.json({ error: "Only images (jpg/png/webp/gif) and videos (mp4/mov/avi/webm) are allowed" }, { status: 400 });
    }

    // Enforce size limits before upload
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const limit = isVideo ? "50 MB" : "10 MB";
      return Response.json({ error: `File too large. Maximum size is ${limit}` }, { status: 400 });
    }

    // Use service role client so we can create/update buckets and bypass RLS.
    const { createClient } = await import("@supabase/supabase-js");
    const storageClient = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : supabase;

    // Ensure the bucket exists with correct settings (only with service role)
    if (serviceRoleKey) {
      const isAvatarBucket = bucket === "avatars";
      const bucketSizeLimit = isAvatarBucket ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      const allowedMimeTypes = isAvatarBucket ? ["image/*"] : ["image/*", "video/*"];

      const { error: createError } = await storageClient.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes,
        fileSizeLimit: bucketSizeLimit,
      });

      if (createError) {
        if (createError.message.toLowerCase().includes("already exists")) {
          // Bucket exists — update settings to ensure correct limits
          await storageClient.storage.updateBucket(bucket, {
            public: true,
            allowedMimeTypes,
            fileSizeLimit: bucketSizeLimit,
          });
        } else {
          console.error("[upload] Bucket creation failed:", createError.message);
        }
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
    const path = `${user.id}/${Date.now()}.${ext}`;

    // Convert to ArrayBuffer for reliable upload in Node.js runtime
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await storageClient.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: bucket === "avatars",
      });

    if (error) {
      console.error("[upload] Upload failed:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = storageClient.storage.from(bucket).getPublicUrl(data.path);

    return Response.json({ url: publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload] Unexpected error:", err);
    return Response.json({ error: message }, { status: 500 });
  }
}
