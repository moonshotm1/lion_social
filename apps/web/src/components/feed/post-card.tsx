"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  BadgeCheck,
} from "lucide-react";
import {
  type MockPost,
  getTimeAgo,
  formatCount,
  postTypeConfig,
} from "@/lib/mock-data";

interface PostCardProps {
  post: MockPost;
  onLike?: (postId: string) => void;
}

export function PostCard({ post, onLike }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isAnimatingLike, setIsAnimatingLike] = useState(false);

  const typeConfig = postTypeConfig[post.type];

  const handleLike = () => {
    setIsAnimatingLike(true);
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
    setTimeout(() => setIsAnimatingLike(false), 300);
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      handleLike();
    }
  };

  return (
    <article className="card-premium p-0 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Link
            href={`/profile/${post.author.username}`}
            className="relative group"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-lion-gold/20 group-hover:ring-lion-gold/50 transition-all duration-300">
              <Image
                src={post.author.avatar}
                alt={post.author.displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* Author info */}
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.author.username}`}
                className="text-sm font-semibold text-lion-white hover:text-lion-gold transition-colors duration-200"
              >
                {post.author.displayName}
              </Link>
              {post.author.isVerified && (
                <BadgeCheck className="w-4 h-4 text-lion-gold fill-lion-gold/20" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lion-gray-3">
                @{post.author.username}
              </span>
              <span className="text-lion-gray-2 text-xs">·</span>
              <span className="text-xs text-lion-gray-3">
                {getTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Post type badge */}
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeConfig.bgColor} ${typeConfig.color}`}
          >
            {typeConfig.emoji} {typeConfig.label}
          </span>

          {/* More button */}
          <button className="p-1.5 rounded-lg text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      {post.image && (
        <div
          className="relative aspect-[4/3] bg-lion-dark-2 cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          <Image
            src={post.image}
            alt={post.caption}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />

          {/* Double-tap like animation overlay */}
          {isAnimatingLike && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-20 h-20 text-lion-gold fill-lion-gold animate-scale-in opacity-90" />
            </div>
          )}
        </div>
      )}

      {/* Caption */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm text-lion-gray-5 leading-relaxed whitespace-pre-line">
          {post.caption}
        </p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-lion-gold/70 hover:text-lion-gold cursor-pointer transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-lion-gold/5">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group"
          >
            <Heart
              className={`w-5 h-5 transition-all duration-200 ${
                isLiked
                  ? "text-lion-gold fill-lion-gold scale-110"
                  : "text-lion-gray-3 group-hover:text-lion-gold"
              } ${isAnimatingLike ? "animate-scale-in" : ""}`}
            />
            <span
              className={`text-xs font-medium ${
                isLiked ? "text-lion-gold" : "text-lion-gray-3"
              }`}
            >
              {formatCount(likeCount)}
            </span>
          </button>

          {/* Comment */}
          <button className="flex items-center gap-1.5 group">
            <MessageCircle className="w-5 h-5 text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200" />
            <span className="text-xs font-medium text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200">
              {formatCount(post.comments)}
            </span>
          </button>

          {/* Share */}
          <button className="flex items-center gap-1.5 group">
            <Share2 className="w-5 h-5 text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200" />
            <span className="text-xs font-medium text-lion-gray-3 group-hover:text-lion-white transition-colors duration-200">
              {formatCount(post.shares)}
            </span>
          </button>
        </div>

        {/* Bookmark */}
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="group"
        >
          <Bookmark
            className={`w-5 h-5 transition-all duration-200 ${
              isBookmarked
                ? "text-lion-gold fill-lion-gold"
                : "text-lion-gray-3 group-hover:text-lion-gold"
            }`}
          />
        </button>
      </div>
    </article>
  );
}
