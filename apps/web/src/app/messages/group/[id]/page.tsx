"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send, ImageIcon, X, Users, Play } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { getTimeAgo } from "@/lib/types";

interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
  sender: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

interface Member {
  userId: string;
  role: string;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
}

interface Group {
  id: string;
  name: string;
  avatarUrl: string | null;
  createdBy: string;
}

export default function GroupThreadPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video"; file: File } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) tokenRef.current = session.access_token;

      const headers: Record<string, string> = {};
      if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;

      try {
        const res = await fetch(`/api/groups/${params.id}/messages`, { headers });
        const data = await res.json();
        setMessages(data.messages ?? []);
        setGroup(data.group ?? null);
        setMembers(data.members ?? []);
        setMyId(data.myId ?? null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : "image";
    setMediaPreview({ url: URL.createObjectURL(file), type, file });
    e.target.value = "";
  };

  const clearMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !mediaPreview) || sending || uploading) return;
    setSending(true);

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tokenRef.current) headers["Authorization"] = `Bearer ${tokenRef.current}`;

    try {
      let uploadedUrl: string | null = null;
      let uploadedType: string | null = null;

      if (mediaPreview) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", mediaPreview.file);
        fd.append("bucket", "messages");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fd,
          headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) { uploadedUrl = uploadData.url; uploadedType = mediaPreview.type; }
        setUploading(false);
        clearMedia();
      }

      const content = text.trim();
      setText("");

      const res = await fetch(`/api/groups/${params.id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content, ...(uploadedUrl ? { mediaUrl: uploadedUrl, mediaType: uploadedType } : {}) }),
      });
      const data = await res.json();
      if (data.message) setMessages((prev) => [...prev, data.message]);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 border-b border-lion-gold/10 shrink-0">
        <Link href="/messages" className="p-1.5 rounded-full hover:bg-lion-dark-2 transition-colors">
          <ArrowLeft className="w-5 h-5 text-lion-white" />
        </Link>
        <button
          className="flex items-center gap-2.5 flex-1 text-left group"
          onClick={() => setShowMembers(v => !v)}
        >
          <div className="w-9 h-9 rounded-full bg-lion-gold/15 border border-lion-gold/30 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-lion-gold" />
          </div>
          <div>
            <p className="text-sm font-semibold text-lion-white group-hover:text-lion-gold transition-colors">
              {group?.name ?? "Group"}
            </p>
            <p className="text-xs text-lion-gray-3">{members.length} members · tap to view</p>
          </div>
        </button>
      </div>

      {/* Members panel (slide-down) */}
      {showMembers && (
        <div className="border-b border-lion-gold/10 bg-lion-dark-2/60 px-4 py-3 space-y-2 shrink-0">
          <p className="text-xs font-semibold text-lion-gray-3 uppercase tracking-wider mb-2">Members</p>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const avatar = m.user.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${m.user.username}`;
              return (
                <Link
                  key={m.userId}
                  href={`/profile/${m.user.username}`}
                  className="flex items-center gap-1.5 bg-lion-dark-3 rounded-full pl-1 pr-3 py-1 hover:border-lion-gold/30 border border-transparent transition-all"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden">
                    <Image src={avatar} alt={m.user.username} width={20} height={20} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-lion-white">{m.user.displayName ?? `@${m.user.username}`}</span>
                  {m.role === "admin" && <span className="text-[10px] text-lion-gold font-semibold">admin</span>}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 scrollbar-none">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-lion-gray-3">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === myId;
            const showAvatar = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            const showName = !isMe && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            const avatar = msg.sender.avatarUrl ?? `https://api.dicebear.com/9.x/avataaars/svg?seed=${msg.sender.username}`;
            const isImage = msg.mediaType === "image" && msg.mediaUrl;
            const isVideo = msg.mediaType === "video" && msg.mediaUrl;
            const hasText = !!msg.content;

            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                {/* Avatar spacer for grouping */}
                {!isMe && (
                  <div className="w-7 shrink-0 self-end">
                    {showAvatar && (
                      <div className="w-7 h-7 rounded-full overflow-hidden">
                        <Image src={avatar} alt={msg.sender.username} width={28} height={28} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[72%] ${isMe ? "" : ""}`}>
                  {showName && (
                    <p className="text-[11px] text-lion-gray-3 mb-1 ml-1">
                      {msg.sender.displayName ?? `@${msg.sender.username}`}
                    </p>
                  )}
                  <div className={`rounded-2xl overflow-hidden ${
                    isMe ? "rounded-br-md bg-lion-gold text-lion-black" : "rounded-bl-md bg-lion-dark-2 text-lion-white"
                  }`}>
                    {isImage && (
                      <a href={msg.mediaUrl!} target="_blank" rel="noopener noreferrer">
                        <div className="relative w-44 aspect-square">
                          <Image src={msg.mediaUrl!} alt="Photo" fill className="object-cover" sizes="176px" />
                        </div>
                      </a>
                    )}
                    {isVideo && (
                      <div className="relative w-44 aspect-video bg-black">
                        <video src={msg.mediaUrl!} className="w-full h-full object-cover" controls playsInline />
                      </div>
                    )}
                    {(hasText || (!isImage && !isVideo)) && (
                      <div className="px-3.5 py-2.5">
                        {hasText && <p className="text-sm leading-relaxed">{msg.content}</p>}
                        <p className={`text-[10px] mt-1 ${isMe ? "text-lion-black/60" : "text-lion-gray-2"}`} suppressHydrationWarning>
                          {getTimeAgo(msg.createdAt)}
                        </p>
                      </div>
                    )}
                    {(isImage || isVideo) && !hasText && (
                      <div className={`px-2 py-1 ${isMe ? "text-right" : ""}`}>
                        <p className="text-[10px] text-lion-gray-2" suppressHydrationWarning>{getTimeAgo(msg.createdAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Media preview */}
      {mediaPreview && (
        <div className="relative w-20 h-20 mx-3 mb-2 rounded-xl overflow-hidden border border-lion-gold/20 shrink-0">
          {mediaPreview.type === "image" ? (
            <Image src={mediaPreview.url} alt="preview" fill className="object-cover" sizes="80px" />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <Play className="w-6 h-6 text-white" />
            </div>
          )}
          <button onClick={clearMedia} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 py-3 border-t border-lion-gold/10 shrink-0">
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full text-lion-gray-3 hover:text-lion-gold hover:bg-lion-gold/10 transition-all duration-200 shrink-0">
          <ImageIcon className="w-5 h-5" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
        <input
          type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Message group..."
          className="flex-1 bg-lion-dark-2 border border-lion-gold/10 rounded-2xl px-4 py-2.5 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/35 focus:ring-1 focus:ring-lion-gold/20 transition-all duration-200"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !mediaPreview) || sending || uploading}
          className="p-2.5 rounded-full bg-gold-gradient text-lion-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-gold-sm shrink-0"
        >
          {uploading || sending ? (
            <div className="w-4 h-4 rounded-full border-2 border-lion-black/40 border-t-lion-black animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
