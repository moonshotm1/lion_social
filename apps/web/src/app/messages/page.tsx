"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Search, X, Edit } from "lucide-react";
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

interface SearchUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) tokenRef.current = session.access_token;
      const headers: Record<string, string> = {};
      if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;
      try {
        const res = await fetch("/api/messages", { headers });
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Debounced user search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
        const data = await res.json();
        setSearchResults(data.users ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, 280);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const showSearch = searchQuery.trim().length > 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold text-lion-white">Messages</h1>
        <div className="flex items-center gap-1 text-xs text-lion-gray-3">
          <Edit className="w-3.5 h-3.5" />
        </div>
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
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lion-gray-3 hover:text-lion-white transition-colors"
          >
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
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lion-dark-2 transition-all duration-200 group"
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
      ) : (
        /* Conversation list */
        isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-lion-gold/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-lion-gold/60" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-lion-white">No messages yet</p>
              <p className="text-xs text-lion-gray-3">Search for someone above to start a conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const avatar =
                conv.partner.avatarUrl ??
                `https://api.dicebear.com/9.x/avataaars/svg?seed=${conv.partner.username}`;
              return (
                <Link
                  key={conv.partnerId}
                  href={`/messages/${conv.partnerId}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-lion-dark-2 transition-all duration-200 group"
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-lion-gold/15 group-hover:ring-lion-gold/35 transition-all duration-300">
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
                      <p className="text-xs text-lion-gray-2 shrink-0 ml-2" suppressHydrationWarning>
                        {getTimeAgo(conv.lastMessageAt)}
                      </p>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-lion-white font-medium" : "text-lion-gray-3"}`}>
                      {conv.lastMessageFromMe ? "You: " : ""}{conv.lastMessage}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
