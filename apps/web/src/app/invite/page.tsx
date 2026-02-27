"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Ticket, Copy, Check, Plus, Loader2, Users } from "lucide-react";
import Link from "next/link";

interface InviteRecord {
  code: string;
  createdAt: string;
  usedAt: string | null;
  usedBy: { username: string } | null;
}

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.resolve();
}

export default function InvitePage() {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    try {
      const res = await fetch("/api/invite/list");
      if (!res.ok) {
        if (res.status === 401) {
          setError("You must be signed in to manage invites.");
        } else {
          setError("Failed to load invites.");
        }
        return;
      }
      const data = await res.json();
      setInvites(data.invites ?? []);
    } catch {
      setError("Failed to load invites.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const generateInvite = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/invite/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate invite.");
        return;
      }
      await fetchInvites();
    } catch {
      setError("Failed to generate invite.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (code: string) => {
    const url = `${window.location.origin}/sign-up?invite=${code}`;
    await copyToClipboard(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pendingInvites = invites.filter((i) => !i.usedAt);
  const usedInvites = invites.filter((i) => i.usedAt);

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
            Gains is invite-only. Share your codes.
          </p>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generateInvite}
        disabled={isGenerating}
        className="w-full py-3 rounded-xl bg-gold-gradient hover:shadow-gold-md text-lion-black font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Generate new invite
          </>
        )}
      </button>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-lion-gold" />
        </div>
      ) : (
        <>
          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider">
                Pending ({pendingInvites.length})
              </h2>
              {pendingInvites.map((invite) => (
                <div
                  key={invite.code}
                  className="flex items-center justify-between gap-3 rounded-xl bg-lion-dark-1 border border-lion-gold/10 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Ticket className="w-4 h-4 text-lion-gold flex-shrink-0" />
                    <span className="font-mono text-lion-gold tracking-widest text-sm font-semibold">
                      {invite.code}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(invite.code)}
                    className="flex items-center gap-1.5 text-xs text-lion-gray-3 hover:text-lion-white transition-colors flex-shrink-0"
                  >
                    {copiedCode === invite.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy link
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Used invites */}
          {usedInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider">
                Used ({usedInvites.length})
              </h2>
              {usedInvites.map((invite) => (
                <div
                  key={invite.code}
                  className="flex items-center justify-between gap-3 rounded-xl bg-lion-dark-1 border border-lion-gold/5 px-4 py-3 opacity-60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Ticket className="w-4 h-4 text-lion-gray-3 flex-shrink-0" />
                    <span className="font-mono text-lion-gray-3 tracking-widest text-sm">
                      {invite.code}
                    </span>
                  </div>
                  {invite.usedBy && (
                    <Link
                      href={`/profile/${invite.usedBy.username}`}
                      className="text-xs text-lion-gray-3 hover:text-lion-gold transition-colors flex-shrink-0"
                    >
                      @{invite.usedBy.username}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {invites.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-lion-gold/10 flex items-center justify-center mx-auto">
                <Crown className="w-7 h-7 text-lion-gold" />
              </div>
              <p className="text-lion-gray-3 text-sm">
                No invites yet. Generate one above to bring a friend into Gains.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
