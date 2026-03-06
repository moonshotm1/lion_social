"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Ticket, Copy, Check, Loader2, Users, Pencil } from "lucide-react";
import Link from "next/link";

interface InviteRecord {
  code: string;
  createdAt: string;
  usedAt: string | null;
  usedByUsername: string | null;
}

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCount, setInviteCount] = useState(5);
  const [invitesUsed, setInvitesUsed] = useState(0);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [meRes, listRes] = await Promise.all([
        fetch("/api/user/me"),
        fetch("/api/invite/list"),
      ]);

      if (meRes.status === 401) {
        setError("You must be signed in to manage invites.");
        setIsLoading(false);
        return;
      }

      if (meRes.ok) {
        const me = await meRes.json();
        setInviteCode(me.inviteCode ?? null);
        setInviteCount(me.inviteCount ?? 5);
        setInvitesUsed(me.invitesUsed ?? 0);
      }

      if (listRes.ok) {
        const listData = await listRes.json();
        setInvites(listData.invites ?? []);
      }
    } catch {
      setError("Failed to load invite data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = async () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/sign-up?invite=${inviteCode}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usedInvites = invites.filter((i) => i.usedByUsername);
  const remaining = inviteCount - invitesUsed;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lion-gold/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-lion-gold" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-lion-white">Invite Friends</h1>
          <p className="text-sm text-lion-gray-3">
            Gains is invite-only. Share your personal code.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-lion-gold" />
        </div>
      ) : inviteCode ? (
        <>
          {/* Invite code card */}
          <div className="rounded-2xl border border-lion-gold/20 bg-lion-dark-2 p-6 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Ticket className="w-4 h-4 text-lion-gold" />
              <span className="text-xs font-semibold text-lion-gold uppercase tracking-wider">
                Your Invite Code
              </span>
            </div>

            <div className="flex items-center gap-3 bg-lion-dark-3 rounded-xl px-4 py-3 border border-lion-gold/15">
              <span className="font-mono text-lg font-bold text-lion-gold tracking-widest flex-1">
                {inviteCode}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm text-lion-gray-3 hover:text-lion-gold transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-gains-green" />
                    <span className="text-gains-green text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-xs">Copy link</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-lion-gray-3">
                <span className="text-lion-white font-semibold">{remaining}</span> of{" "}
                <span className="text-lion-white font-semibold">{inviteCount}</span> invites remaining
              </span>
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 text-xs text-lion-gold hover:text-lion-gold-light transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Customize
              </Link>
            </div>

            {remaining <= 0 && (
              <p className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
                You've used all your invites. Contact support to get more.
              </p>
            )}
          </div>

          {/* How it works */}
          <div className="rounded-xl bg-lion-dark-2/40 border border-lion-dark-4 px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-lion-gray-4 uppercase tracking-wider">How it works</p>
            <ol className="space-y-1.5 text-xs text-lion-gray-3 list-none">
              <li className="flex gap-2"><span className="text-lion-gold shrink-0">1.</span> Copy your invite link above</li>
              <li className="flex gap-2"><span className="text-lion-gold shrink-0">2.</span> Share it with someone you want to invite</li>
              <li className="flex gap-2"><span className="text-lion-gold shrink-0">3.</span> They sign up using your code</li>
              <li className="flex gap-2"><span className="text-lion-gold shrink-0">4.</span> They join the community!</li>
            </ol>
          </div>

          {/* Members invited */}
          {usedInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider">
                Members you invited ({usedInvites.length})
              </h2>
              {usedInvites.map((invite, idx) => (
                <Link
                  key={idx}
                  href={`/profile/${invite.usedByUsername}`}
                  className="flex items-center gap-3 rounded-xl bg-lion-dark-1 border border-lion-gold/10 px-4 py-3 hover:border-lion-gold/20 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-lion-gold/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-lion-gold">
                      {invite.usedByUsername?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-lion-white font-medium flex-1">
                    @{invite.usedByUsername}
                  </span>
                  <span className="text-xs text-lion-gray-2">
                    {invite.usedAt ? new Date(invite.usedAt).toLocaleDateString() : ""}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {usedInvites.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-lion-gold/10 flex items-center justify-center mx-auto">
                <Crown className="w-7 h-7 text-lion-gold" />
              </div>
              <p className="text-lion-gray-3 text-sm">
                No one has joined with your code yet.
                <br />Share it with your friends!
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 space-y-3">
          <p className="text-sm text-lion-gray-3">
            Your invite code isn't set up yet. Try signing out and back in.
          </p>
        </div>
      )}
    </div>
  );
}
