"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Send } from "lucide-react";
import { PostCard } from "@/components/feed/post-card";
import { isClientDemoMode } from "@/lib/env-client";
import { mockPosts } from "@/lib/mock-data";
import { trpc } from "@/lib/trpc";
import { transformPost } from "@/lib/transforms";
import { getTimeAgo } from "@/lib/types";
import type { MockPost } from "@/lib/types";

// ─── Comment list ──────────────────────────────────────────────────────────

interface CommentUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface PostComment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: CommentUser;
}

function CommentList({ comments }: { comments: PostComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-lion-gray-3">No comments yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-lion-gold/5">
      {comments.map((comment) => {
        const avatar =
          comment.user.avatarUrl ??
          `https://api.dicebear.com/9.x/avataaars/svg?seed=${comment.user.username}`;
        const timeAgo = getTimeAgo(
          comment.createdAt instanceof Date
            ? comment.createdAt.toISOString()
            : comment.createdAt
        );

        return (
          <div key={comment.id} className="flex gap-3 px-4 py-4">
            <Link href={`/profile/${comment.user.username}`} className="shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-lion-gold/20">
                <Image
                  src={avatar}
                  alt={comment.user.username}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <Link
                  href={`/profile/${comment.user.username}`}
                  className="text-sm font-semibold text-lion-white hover:text-lion-gold transition-colors duration-200"
                >
                  {comment.user.username}
                </Link>
                <span className="text-xs text-lion-gray-2">{timeAgo}</span>
              </div>
              <p className="text-sm text-lion-gray-4 leading-relaxed">
                {comment.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Comment input ─────────────────────────────────────────────────────────

function CommentInput({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (content: string) => void;
  isSubmitting: boolean;
}) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 px-4 py-3 border-t border-lion-gold/10">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a comment… (Enter to send)"
        rows={1}
        className="flex-1 resize-none bg-lion-dark-2 border border-lion-gold/10 rounded-xl px-4 py-2.5 text-sm text-lion-white placeholder:text-lion-gray-3 focus:outline-none focus:border-lion-gold/30 focus:ring-1 focus:ring-lion-gold/20 transition-colors max-h-28 overflow-y-auto"
      />
      <button
        type="submit"
        disabled={!text.trim() || isSubmitting}
        className="p-2.5 rounded-xl bg-gold-gradient text-lion-black disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-gold-sm flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
}

// ─── Shared detail shell ───────────────────────────────────────────────────

function PostDetailShell({
  post,
  comments,
  isLoading,
  onComment,
  isCommenting,
}: {
  post: MockPost | null;
  comments: PostComment[];
  isLoading: boolean;
  onComment?: (content: string) => void;
  isCommenting?: boolean;
}) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-lion-gold/30 border-t-lion-gold animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <p className="text-lion-gray-3 text-sm">Post not found.</p>
        <button
          onClick={() => router.back()}
          className="btn-ghost-gold px-5 py-2.5 text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-8 -mx-4 -mt-6">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-lion-black/80 backdrop-blur-xl border-b border-lion-gold/10">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/profile/${post.author.username}`} className="shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-lion-gold/20">
              <Image
                src={post.author.avatar}
                alt={post.author.displayName}
                width={28}
                height={28}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <Link
            href={`/profile/${post.author.username}`}
            className="text-sm font-semibold text-lion-white hover:text-lion-gold transition-colors duration-200 truncate"
          >
            {post.author.displayName}
          </Link>
          {post.author.isVerified && (
            <BadgeCheck className="w-4 h-4 text-lion-gold fill-lion-gold/20 shrink-0" />
          )}
        </div>
      </div>

      {/* Post card (expanded = full story text, no click-to-navigate) */}
      <div className="px-4 pt-4">
        <PostCard post={post} expanded />
      </div>

      {/* Comments section */}
      <div className="mt-4 border-t border-lion-gold/10">
        <div className="px-4 py-3">
          <h3 className="text-sm font-semibold text-lion-gold uppercase tracking-wider">
            Comments · {comments.length}
          </h3>
        </div>
        <CommentList comments={comments} />
        {onComment && (
          <CommentInput onSubmit={onComment} isSubmitting={isCommenting ?? false} />
        )}
      </div>
    </div>
  );
}

// ─── Demo mode ────────────────────────────────────────────────────────────

function PostDetailDemo({ id }: { id: string }) {
  const post = mockPosts.find((p) => p.id === id) ?? mockPosts[0] ?? null;
  return <PostDetailShell post={post} comments={[]} isLoading={false} />;
}

// ─── Real mode ────────────────────────────────────────────────────────────

function PostDetailReal({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const query = trpc.post.byId.useQuery({ id }, { retry: false });
  const recordView = trpc.post.recordView.useMutation({
    onSuccess: () => {
      // Refetch so the view count shown on screen reflects the new view
      utils.post.byId.invalidate({ id });
    },
  });

  // Record a view once we know the post exists (runs once per mount per post)
  useEffect(() => {
    if (query.data?.id) {
      recordView.mutate({ postId: query.data.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data?.id]);

  const addComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      utils.post.byId.invalidate({ id });
    },
  });

  const post = query.data ? transformPost(query.data) : null;
  const comments = (query.data?.comments ?? []) as PostComment[];

  return (
    <PostDetailShell
      post={post}
      comments={comments}
      isLoading={query.isLoading}
      onComment={(content) => addComment.mutate({ postId: id, content })}
      isCommenting={addComment.isPending}
    />
  );
}

// ─── Page entry point ──────────────────────────────────────────────────────

export default function PostDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  if (isClientDemoMode) {
    return <PostDetailDemo id={id} />;
  }

  return <PostDetailReal id={id} />;
}
