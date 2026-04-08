"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Search, X, Users, Plus, Check, ChevronRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getTimeAgo } from "@/lib/types";

interface Conversation {
  partnerId: string;
  partner: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
}

interface GroupPreview {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
  lastMessage: string | null;
  lastMessageAt: string;
}

interface SearchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

// ─── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ token, onCreated, onClose }: {
  token: string | null;
  onCreated: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [selected, setSelected] = useState<SearchUser[]>([]);
  const [creating, setCreating] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!query.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setResults(data.users ?? []);
    }, 280);
  }, [query]);

  const toggle = (user: SearchUser) => {
    setSelected(prev =>
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.length === 0 || creating) return;
    setCreating(true);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: name.trim(), memberIds: selected.map(u => u.id) }),
      });
      const data = await res.json();
      if (data.groupId) onCreated();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-lion-dark-1 rounded-t-3xl border-t border-lion-gold/15 p-5 space-y-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-lion-white">New Group</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-lion-dark-2 transition-colors">
            <X className="w-4 h-4 text-lion-gray-3" />
          </button>
        </div>

        {/* Group name */}
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Group name..."
          className="w-full bg-lion-dark-2 border border-lion-gold/10 rounded-2xl px-4 py-3 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 transition-all"
        />

        {/* Selected members chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map(u => (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                className="flex items-center gap-1.5 bg-lion-gold/15 border border-lion-gold/30 text-lion-gold rounded-full px-3 py-1 text-xs font-semibold"
              >
                @{u.username}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lion-gray-3 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Add people..."
            className="w-full bg-lion-dark-2 border border-lion-gold/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 transition-all"
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {results.map(user => {
            const isSelected = !!selected.find(u => u.id === user.id);
            const avatar = user.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;
            return (
              <button
                key={user.id}
                onClick={() => toggle(user)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  isSelected ? "bg-lion-gold/10 border border-lion-gold/25" : "hover:bg-lion-dark-2 border border-transparent"
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  <Image src={avatar} alt={user.username} width={36} height={36} className="w-full h-full object-cover" />
                </div>
                <p className="flex-1 text-sm font-semibold text-lion-white text-left">@{user.username}</p>
                {isSelected && <Check className="w-4 h-4 text-lion-gold shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={!name.trim() || selected.length === 0 || creating}
          className="w-full py-3 rounded-2xl text-sm font-bold btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? "Creating..." : `Create group · ${selected.length + 1} members`}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<GroupPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) tokenRef.current = session.access_token;
    const headers: Record<string, string> = {};
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
    const [dmsRes, groupsRes] = await Promise.all([
      fetch("/api/messages", { headers }),
      fetch("/api/groups", { headers }),
    ]);
    const [dmsData, groupsData] = await Promise.all([dmsRes.json(), groupsRes.json()]);
    setConversations(dmsData.conversations ?? []);
    setGroups(groupsData.groups ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced user search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      setSearchResults(data.users ?? []);
      setSearchLoading(false);
    }, 280);
  }, [searchQuery]);

  const showSearch = searchQuery.trim().length > 0;

  // Merge DMs + groups into a single sorted list
  type InboxItem =
    | { kind: "dm"; conv: Conversation; at: string }
    | { kind: "group"; group: GroupPreview; at: string };

  const inbox: InboxItem[] = [
    ...conversations.map(c => ({ kind: "dm" as const, conv: c, at: c.lastMessageAt })),
    ...groups.map(g => ({ kind: "group" as const, group: g, at: g.lastMessageAt })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-lion-white">Messages</h1>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lion-gold/10 border border-lion-gold/20 hover:border-lion-gold/40 text-lion-gold text-xs font-semibold transition-all"
        >
          <Users className="w-3.5 h-3.5" />
          <Plus className="w-3 h-3" />
          Group
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-lion-gray-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people to message..."
          className="w-full bg-lion-dark-2 border border-lion-gold/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 focus:ring-1 focus:ring-lion-gold/20 transition-all duration-200"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results */}
      {showSearch ? (
        <div className="space-y-1">
          {searchLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-lion-gray-3">No users found</p>
            </div>
          ) : (
            searchResults.map((user) => {
              const avatar = user.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.username}`;
              return (
                <Link
                  key={user.id}
                  href={`/messages/${user.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lion-dark-2 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-lion-gold/15 group-hover:ring-lion-gold/35 transition-all shrink-0">
                    <Image src={avatar} alt={user.username} width={44} height={44} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-lion-white truncate">@{user.username}</p>
                    {user.bio && <p className="text-xs text-lion-gray-3 truncate mt-0.5">{user.bio}</p>}
                  </div>
                  <MessageCircle className="w-4 h-4 text-lion-gray-3 group-hover:text-lion-gold transition-colors shrink-0" />
                </Link>
              );
            })
          )}
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
        </div>
      ) : inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-lion-gold/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-lion-gold/60" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-lion-white">No messages yet</p>
            <p className="text-xs text-lion-gray-3">Search for someone above or create a group</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {inbox.map((item) => {
            if (item.kind === "dm") {
              const conv = item.conv;
              const avatar = conv.partner.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${conv.partner.username}`;
              return (
                <Link key={`dm-${conv.partnerId}`} href={`/messages/${conv.partnerId}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lion-dark-2 transition-all group">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-lion-gold/15 group-hover:ring-lion-gold/35 transition-all">
                      <Image src={avatar} alt={conv.partner.username} width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-lion-gold text-lion-black text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? "text-lion-white" : "text-lion-gray-5"}`}>
                        {conv.partner.displayName ?? `@${conv.partner.username}`}
                      </p>
                      <p className="text-xs text-lion-gray-2 shrink-0 ml-2" suppressHydrationWarning>{getTimeAgo(conv.lastMessageAt)}</p>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-lion-white font-medium" : "text-lion-gray-3"}`}>
                      {conv.lastMessageFromMe ? "You: " : ""}{conv.lastMessage}
                    </p>
                  </div>
                </Link>
              );
            }

            // Group
            const g = item.group;
            return (
              <Link key={`group-${g.id}`} href={`/messages/group/${g.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lion-dark-2 transition-all group">
                <div className="w-12 h-12 rounded-full bg-lion-gold/15 border border-lion-gold/25 flex items-center justify-center shrink-0 group-hover:border-lion-gold/40 transition-all">
                  <Users className="w-5 h-5 text-lion-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-lion-white truncate">{g.name}</p>
                    <p className="text-xs text-lion-gray-2 shrink-0 ml-2" suppressHydrationWarning>{getTimeAgo(g.lastMessageAt)}</p>
                  </div>
                  <p className="text-xs text-lion-gray-3 truncate mt-0.5">
                    {g.lastMessage ?? `${g.memberCount} members`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-lion-gray-2 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Create group modal */}
      {showCreateGroup && (
        <CreateGroupModal
          token={tokenRef.current}
          onCreated={() => { setShowCreateGroup(false); load(); }}
          onClose={() => setShowCreateGroup(false)}
        />
      )}
    </div>
  );
}
