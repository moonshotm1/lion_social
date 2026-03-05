"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, AlertCircle, Loader2, Ticket, X } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  inviteCode?: string | null;
}

export default function EditProfilePage() {
  const router = useRouter();

  // ── Profile state ──
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Form state ──
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // ── Username availability ──
  const [usernameToCheck, setUsernameToCheck] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(false);

  // ── Invite code state ──
  const [currentInviteCode, setCurrentInviteCode] = useState<string | null>(null);
  const [newInviteCode, setNewInviteCode] = useState("");
  const [inviteCodeStatus, setInviteCodeStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [inviteCodeSuccess, setInviteCodeSuccess] = useState(false);

  // ── Submit state ──
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load profile on mount ──
  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to load profile");
        }
        return res.json() as Promise<UserProfile>;
      })
      .then((data) => {
        setProfile(data);
        setUsername(data.username);
        setBio(data.bio ?? "");
        setAvatarPreview(data.avatarUrl ?? null);
        setCurrentInviteCode(data.inviteCode ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message);
        setIsLoading(false);
      });
  }, []);

  // ── Username format validation ──
  const usernameFormatError = (() => {
    if (username.length === 0) return null;
    if (username.length < 3) return "Must be at least 3 characters";
    if (username.length > 30) return "Must be 30 characters or fewer";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Only letters, numbers, and underscores";
    return null;
  })();

  // ── Debounced availability check ──
  const checkAvailability = useCallback(async (name: string) => {
    setIsCheckingUsername(true);
    setIsUsernameTaken(false);
    setIsUsernameAvailable(false);
    try {
      const res = await fetch(`/api/trpc/user.byUsername?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": { json: { username: name } } }))}`)
      if (res.ok) {
        const json = await res.json();
        const found = json?.[0]?.result?.data?.json;
        if (found && found.id !== profile?.id) {
          setIsUsernameTaken(true);
        } else {
          setIsUsernameAvailable(true);
        }
      }
    } catch {
      // ignore — let user try to save
    } finally {
      setIsCheckingUsername(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (usernameFormatError || !username || username === profile?.username) {
      setUsernameToCheck("");
      setIsUsernameTaken(false);
      setIsUsernameAvailable(false);
      return;
    }
    setIsUsernameAvailable(false);
    setIsUsernameTaken(false);
    const timer = setTimeout(() => setUsernameToCheck(username), 500);
    return () => clearTimeout(timer);
  }, [username, profile?.username, usernameFormatError]);

  useEffect(() => {
    if (usernameToCheck) checkAvailability(usernameToCheck);
  }, [usernameToCheck, checkAvailability]);

  // ── Invite code debounce & check ──
  const inviteCodeFormatError = (() => {
    if (!newInviteCode) return null;
    const code = newInviteCode.toUpperCase();
    if (code.length < 3) return "Must be at least 3 characters";
    if (code.length > 20) return "Must be 20 characters or fewer";
    if (!/^[A-Z0-9]+$/.test(code)) return "Only letters and numbers allowed";
    return null;
  })();

  useEffect(() => {
    const code = newInviteCode.trim().toUpperCase();
    if (!code || inviteCodeFormatError || code === currentInviteCode) {
      setInviteCodeStatus("idle");
      setInviteCodeError(null);
      return;
    }
    setInviteCodeStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/invite/check?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (data.available) {
          setInviteCodeStatus("available");
          setInviteCodeError(null);
        } else {
          setInviteCodeStatus("taken");
          setInviteCodeError(data.error ?? "Code is already taken");
        }
      } catch {
        setInviteCodeStatus("idle");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [newInviteCode, currentInviteCode, inviteCodeFormatError]);

  const handleSaveInviteCode = async () => {
    const code = newInviteCode.trim().toUpperCase();
    if (!code || inviteCodeStatus !== "available") return;
    setIsSavingCode(true);
    setInviteCodeError(null);
    try {
      const res = await fetch("/api/invite/customize", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update invite code");
      setCurrentInviteCode(code);
      setNewInviteCode("");
      setInviteCodeStatus("idle");
      setInviteCodeSuccess(true);
      setTimeout(() => setInviteCodeSuccess(false), 3000);
    } catch (err) {
      setInviteCodeError(err instanceof Error ? err.message : "Failed to update invite code");
    } finally {
      setIsSavingCode(false);
    }
  };

  // ── Avatar selection ──
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const usernameError = usernameFormatError ?? (isUsernameTaken ? "Username is already taken" : null);
  const isValid = !usernameError && !isCheckingUsername && username.trim().length >= 3;

  // ── Submit ──
  const handleSave = async () => {
    if (!isValid || !profile) return;
    setSaveError(null);

    let newAvatarUrl: string | undefined;

    // 1. Upload avatar if changed
    if (avatarFile) {
      setIsUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", avatarFile);
        fd.append("bucket", "avatars");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Avatar upload failed");
        newAvatarUrl = body.url as string;
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : "Avatar upload failed");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // 2. Save profile via /api/profile
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (username !== profile.username) payload.username = username;
      if (bio !== (profile.bio ?? "")) payload.bio = bio;
      if (newAvatarUrl) payload.avatarUrl = newAvatarUrl;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to save profile");

      setSaveSuccess(true);
      const saved = body as UserProfile;
      setTimeout(() => router.push(`/profile/${saved.username}`), 800);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading / error states ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
        <p className="text-sm text-red-400">{loadError ?? "Profile not found"}</p>
        <Link href="/sign-in" className="btn-gold px-6 py-2.5 text-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const isBusy = isUploading || isSaving;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${profile.username}`}
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
            accept="image/jpeg,image/png,image/webp,image/gif"
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
                className="input-dark text-sm pl-7 pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <Loader2 className="w-4 h-4 text-lion-gray-3 animate-spin" />
                )}
                {!isCheckingUsername && isUsernameAvailable && (
                  <Check className="w-4 h-4 text-gains-green" />
                )}
                {!isCheckingUsername && isUsernameTaken && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>

            {usernameFormatError && username.length > 0 && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {usernameFormatError}
              </p>
            )}
            {!usernameFormatError && isUsernameTaken && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Username is already taken
              </p>
            )}
            {!usernameFormatError && isUsernameAvailable && (
              <p className="text-xs text-gains-green mt-2 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Username is available
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

        {/* Invite Code */}
        <div className="rounded-xl border border-lion-gold/10 bg-lion-dark-2 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-lion-gold" />
            <h3 className="text-sm font-semibold text-lion-gold uppercase tracking-wider">
              Invite Code
            </h3>
          </div>
          {currentInviteCode && (
            <p className="text-xs text-lion-gray-3">
              Current code:{" "}
              <span className="font-mono font-bold text-lion-gold tracking-widest">
                {currentInviteCode}
              </span>
            </p>
          )}
          <div className="relative">
            <input
              type="text"
              value={newInviteCode}
              onChange={(e) => setNewInviteCode(e.target.value.toUpperCase())}
              placeholder={currentInviteCode ?? "Choose a code"}
              maxLength={20}
              className="input-dark text-sm pr-9 font-mono tracking-widest uppercase"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {inviteCodeStatus === "checking" && (
                <Loader2 className="w-4 h-4 text-lion-gray-3 animate-spin" />
              )}
              {inviteCodeStatus === "available" && (
                <Check className="w-4 h-4 text-gains-green" />
              )}
              {inviteCodeStatus === "taken" && (
                <X className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          {inviteCodeFormatError && newInviteCode && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {inviteCodeFormatError}
            </p>
          )}
          {!inviteCodeFormatError && inviteCodeStatus === "taken" && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {inviteCodeError ?? "Code is already taken"}
            </p>
          )}
          {!inviteCodeFormatError && inviteCodeStatus === "available" && (
            <p className="text-xs text-gains-green flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Code is available
            </p>
          )}
          <p className="text-xs text-lion-gray-2">
            3–20 characters, letters and numbers only
          </p>
          {inviteCodeSuccess && (
            <p className="text-xs text-gains-green flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Invite code updated!
            </p>
          )}
          {inviteCodeError && inviteCodeStatus === "idle" && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {inviteCodeError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveInviteCode}
            disabled={inviteCodeStatus !== "available" || isSavingCode}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed btn-gold"
          >
            {isSavingCode ? "Saving..." : "Save Invite Code"}
          </button>
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
          href={`/profile/${profile.username}`}
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
            : isSaving
            ? "Saving..."
            : saveSuccess
            ? "Saved!"
            : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
