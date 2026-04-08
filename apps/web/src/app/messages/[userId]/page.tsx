"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getTimeAgo } from "@/lib/types";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface OtherUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export default function MessageThreadPage({ params }: { params: { userId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [myDbId, setMyDbId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) tokenRef.current = session.access_token;

      const headers: Record<string, string> = {};
      if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;

      // Fetch my db user id (to determine bubble alignment)
      const meRes = await fetch("/api/user/me", { headers }).then(r => r.json()).catch(() => null);
      if (meRes?.id) setMyDbId(meRes.id);

      try {
        const res = await fetch(`/api/messages/${params.userId}`, { headers });
        const data = await res.json();
        setMessages(data.messages ?? []);
        setOtherUser(data.otherUser ?? null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ recipientId: params.userId, content }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setSending(false);
    }
  };

  const avatar =
    otherUser?.avatarUrl ??
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${otherUser?.username ?? params.userId}`;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 border-b border-lion-gold/10 shrink-0">
        <Link href="/messages" className="p-1.5 rounded-full hover:bg-lion-dark-2 transition-colors">
          <ArrowLeft className="w-5 h-5 text-lion-white" />
        </Link>
        {otherUser && (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-lion-gold/15 group-hover:ring-lion-gold/35 transition-all">
              <Image src={avatar} alt={otherUser.username} width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold text-lion-white group-hover:text-lion-gold transition-colors">
                {otherUser.displayName ?? `@${otherUser.username}`}
              </p>
              <p className="text-xs text-lion-gray-3">@{otherUser.username}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2 scrollbar-none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-lion-gray-3">No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === myDbId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-lion-gold text-lion-black rounded-br-md"
                      : "bg-lion-dark-2 text-lion-white rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-lion-black/60" : "text-lion-gray-2"}`} suppressHydrationWarning>
                    {getTimeAgo(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 py-3 border-t border-lion-gold/10 shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-lion-dark-2 border border-lion-gold/10 rounded-2xl px-4 py-2.5 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 focus:ring-1 focus:ring-lion-gold/20 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-gold-gradient text-lion-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-gold-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
