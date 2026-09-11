"use client";

import { useState } from "react";
import Image from "next/image";
import { GossipPost } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";

interface PostCardProps {
  post: GossipPost;
  onReact: (id: string, emoji: string) => void;
  onAddComment: (id: string, text: string) => Promise<void>;
}

export default function PostCard({ post, onReact, onAddComment }: PostCardProps) {
  const [revealed, setRevealed] = useState(false);
  const blurred = post.nsfw && !revealed;

  return (
    <article className="break-inside-avoid mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{formatRelativeTime(post.createdAt)}</span>
      </div>

      <div className="relative">
        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap text-white/90 ${
            blurred ? "blur-md select-none" : ""
          }`}
        >
          {post.text}
        </p>

        {post.imageUrl && (
          <div className="relative mt-3 w-full overflow-hidden rounded-xl bg-black/20">
            <Image
              src={post.imageUrl}
              alt=""
              width={600}
              height={400}
              unoptimized
              className={`w-full h-auto object-cover ${
                blurred ? "blur-xl scale-105" : ""
              }`}
            />
          </div>
        )}

        {blurred && (
          <button
            onClick={() => setRevealed(true)}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Reveal NSFW content"
          >
            <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white">
              🙈 NSFW · tap to reveal
            </span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {post.nsfw && (
          <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
            NSFW
          </span>
        )}
        <div className="ml-auto">
          <ReactionBar postId={post.id} reactions={post.reactions} onToggle={onReact} />
        </div>
      </div>

      <CommentSection postId={post.id} comments={post.comments} onAddComment={onAddComment} />
    </article>
  );
}
