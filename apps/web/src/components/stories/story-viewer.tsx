"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

export interface StoryItem {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  mediaUrl: string | null;
  text: string | null;
  createdAt: string;
  expiresAt: string;
}

interface StoryViewerProps {
  stories: StoryItem[];
  initialIndex?: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000;

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const story = stories[current];

  const advance = () => {
    if (current < stories.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    if (current > 0) {
      setCurrent((c) => c - 1);
    }
  };

  // Auto-advance timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / STORY_DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        advance();
      }
    };

    timerRef.current = setInterval(tick, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") goBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!story) return null;

  const avatar =
    story.avatarUrl ??
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${story.username}`;

  const timeAgo = (() => {
    try {
      const diffMs = Date.now() - new Date(story.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${Math.floor(diffHrs / 24)}d ago`;
    } catch {
      return "";
    }
  })();

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Story card */}
      <div
        className="relative w-full max-w-sm h-full max-h-[calc(100dvh)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {stories.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 bg-white/25 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < current
                      ? "100%"
                      : i === current
                      ? `${progress * 100}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 left-0 right-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-lion-gold/60">
              <Image
                src={avatar}
                alt={story.username}
                width={36}
                height={36}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-tight">
                {story.displayName ?? story.username}
              </p>
              <p className="text-[10px] text-white/60">{timeAgo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="w-full h-full bg-lion-dark-1">
          {story.mediaUrl ? (
            <Image
              src={story.mediaUrl}
              alt="Story"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-lion-dark-2 via-lion-dark-1 to-lion-black flex items-center justify-center p-8">
              <p className="text-white text-xl font-semibold text-center leading-relaxed">
                {story.text}
              </p>
            </div>
          )}
        </div>

        {/* Tap zones */}
        <div className="absolute inset-0 z-10 flex">
          {/* Left — go back */}
          <div className="w-1/3 h-full cursor-pointer" onClick={goBack} />
          {/* Right — advance */}
          <div className="w-2/3 h-full cursor-pointer" onClick={advance} />
        </div>
      </div>
    </div>
  );
}
