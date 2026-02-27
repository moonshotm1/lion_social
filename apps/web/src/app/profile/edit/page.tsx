"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { trpc } from "@/lib/trpc";
import { isClientDemoMode } from "@/lib/env-client";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isSignedIn, isLoading: userLoading } = useCurrentUser();

  // ── Form state (seeded from current user once loaded) ──
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Seed form once the user loads
  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setBio(user.bio ?? "");
      setAvatarPreview(user.avatar ?? null);
    }
  }, [user?.id]);

  // ── Upload & mutation state ──
  const [isUploading, setIsUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── tRPC update mutation ──
  const updateMutation = isClientDemoMode
    ? null
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      trpc.user.update.useMutation({
        onSuccess: (updatedUser) => {
          setSaveSuccess(true);
          // Navigate to the (possibly renamed) profile
          setTimeout(() => {
            router.push(`/profile/${updatedUser.username}`);
          }, 800);
        },
        onError: (err) => {
          setSaveError(err.message);
        },
      });

  // ── Avatar selection ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Validation ──
  const usernameError = (() => {
    if (username.length < 3) return "Must be at least 3 characters";
    if (username.length > 30) return "Must be 30 characters or fewer";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Only letters, numbers, and underscores";
    return null;
  })();

  const isValid = !usernameError && username.trim().length > 0;

  // ── Submit ──
  const handleSave = async () => {
    if (!isValid) return;
    setSaveError(null);

    let newAvatarUrl: string | undefined;

    // Upload avatar if changed
    if (avatarFile) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", avatarFile);
        fd.append("bucket", "avatars");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Avatar upload failed");
        }
        const { url } = await res.json();
        newAvatarUrl = url as string;
      } catch (err: any) {
        setSaveError(err.message);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (isClientDemoMode) {
      // In demo mode, just navigate back
      router.push(`/profile/${username}`);
      return;
    }

    updateMutation?.mutate({
      username: username !== user?.username ? username : undefined,
      bio: bio !== (user?.bio ?? "") ? bio : undefined,
      avatarUrl: newAvatarUrl,
    });
  };

  // ── Auth gate ──
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <p className="text-sm text-lion-gray-3">Sign in to edit your profile.</p>
        <Link href="/sign-in" className="btn-gold px-6 py-2.5 text-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const isBusy = isUploading || (updateMutation?.isPending ?? false);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${user.username}`}
          className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-lion-white">Edit Profile</h1>
          <p className="text-sm text-lion-gray-3">Update your public profile</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-lion-gold/30 bg-lion-dark-2">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized={avatarPreview.startsWith("data:")}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-lion-dark-2 to-lion-dark-3" />
            )}
          </div>

          {/* Camera overlay button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-lion-gold flex items-center justify-center shadow-lg hover:bg-lion-gold/90 transition-colors duration-200"
          >
            <Camera className="w-4 h-4 text-lion-black" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-sm text-lion-gold hover:text-lion-gold/80 transition-colors duration-200 font-medium"
        >
          Change photo
        </button>
      </div>

      {/* Form fields */}
      <div className="space-y-5">
        {/* Username */}
        <div className="rounded-xl border border-lion-gold/10 bg-lion-dark-2 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-lion-gold uppercase tracking-wider">
            Username
          </h3>
          <div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lion-gray-3 text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="username"
                maxLength={30}
                className="input-dark text-sm pl-7"
              />
            </div>
            {usernameError && username.length > 0 && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {usernameError}
              </p>
            )}
            <p className="text-xs text-lion-gray-2 mt-2">
              {username.length}/30 · Only letters, numbers, and underscores
            </p>
          </div>
        </div>

        {/* Bio */}
        <div className="rounded-xl border border-lion-gold/10 bg-lion-dark-2 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-lion-gold uppercase tracking-wider">
            Bio
          </h3>
          <div className="relative">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about yourself..."
              rows={4}
              maxLength={500}
              className="input-dark resize-none text-sm leading-relaxed"
            />
            <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
              {bio.length}/500
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {saveError && (
        <div className="rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-3 flex items-start gap-2.5 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {saveError}
        </div>
      )}

      {/* Success */}
      {saveSuccess && (
        <div className="rounded-xl bg-green-400/10 border border-green-400/20 px-4 py-3 flex items-center gap-2.5 text-sm text-green-400">
          <Check className="w-4 h-4" />
          Profile updated! Redirecting…
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/profile/${user.username}`}
          className="btn-ghost-gold flex-1 text-center text-sm"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={!isValid || isBusy || saveSuccess}
          className={`
            flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300
            ${isValid && !isBusy && !saveSuccess
              ? "btn-gold"
              : "bg-lion-dark-3 text-lion-gray-2 cursor-not-allowed"}
          `}
        >
          {isUploading
            ? "Uploading photo..."
            : updateMutation?.isPending
            ? "Saving..."
            : saveSuccess
            ? "Saved!"
            : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
