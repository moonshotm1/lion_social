"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, ImagePlus, Type, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Mode = "pick" | "text" | "media";

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  const [mode, setMode] = useState<Mode>("pick");
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
    setMode("media");
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not signed in");

      let mediaUrl: string | undefined;

      // Upload media if present
      if (mediaFile) {
        const fd = new FormData();
        fd.append("file", mediaFile);
        fd.append("bucket", "posts");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");
        mediaUrl = uploadData.url as string;
      }

      const body: { text?: string; mediaUrl?: string } = {};
      if (text.trim()) body.text = text.trim();
      if (mediaUrl) body.mediaUrl = mediaUrl;

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create story");

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (mode === "text" && text.trim().length > 0) ||
    (mode === "media" && !!mediaFile);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-lion-dark-1 rounded-t-3xl border-t border-lion-gold/15 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-lion-gold/10">
          <h2 className="text-base font-bold text-lion-white">New Story</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 pb-8">
          {/* Mode: Pick */}
          {mode === "pick" && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-lion-gold/15 bg-lion-dark-2 hover:border-lion-gold/40 hover:bg-lion-dark-3 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-lion-gold/10 flex items-center justify-center group-hover:bg-lion-gold/20 transition-colors duration-200">
                  <ImagePlus className="w-6 h-6 text-lion-gold" />
                </div>
                <span className="text-sm font-semibold text-lion-white">Photo / Video</span>
              </button>

              <button
                onClick={() => setMode("text")}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-lion-gold/15 bg-lion-dark-2 hover:border-lion-gold/40 hover:bg-lion-dark-3 transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-lion-gold/10 flex items-center justify-center group-hover:bg-lion-gold/20 transition-colors duration-200">
                  <Type className="w-6 h-6 text-lion-gold" />
                </div>
                <span className="text-sm font-semibold text-lion-white">Text</span>
              </button>
            </div>
          )}

          {/* Mode: Text */}
          {mode === "text" && (
            <div className="space-y-3">
              <div className="relative min-h-[140px] rounded-2xl bg-gradient-to-br from-lion-dark-2 to-lion-dark-3 border border-lion-gold/10 overflow-hidden">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share something inspiring..."
                  maxLength={300}
                  rows={5}
                  className="w-full h-full bg-transparent p-4 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none resize-none leading-relaxed"
                />
                <div className="absolute bottom-2 right-3 text-xs text-lion-gray-2">
                  {text.length}/300
                </div>
              </div>
              <button
                onClick={() => { setMode("pick"); setText(""); }}
                className="text-xs text-lion-gray-3 hover:text-lion-white transition-colors duration-200"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Mode: Media preview */}
          {mode === "media" && mediaPreview && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[300px] bg-lion-dark-3">
                <Image
                  src={mediaPreview}
                  alt="Story preview"
                  fill
                  className="object-cover"
                  unoptimized={mediaPreview.startsWith("data:")}
                />
              </div>
              <button
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                  setMode("pick");
                }}
                className="text-xs text-lion-gray-3 hover:text-lion-white transition-colors duration-200"
              >
                ← Change media
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          {/* Submit */}
          {(mode === "text" || mode === "media") && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full py-3 rounded-xl text-sm font-semibold btn-gold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share Story"
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
