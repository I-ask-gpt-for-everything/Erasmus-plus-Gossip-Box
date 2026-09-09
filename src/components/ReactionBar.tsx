"use client";

import { REACTION_EMOJIS } from "@/lib/types";
import { getMyReactions } from "@/lib/postsStore";

interface ReactionBarProps {
  postId: string;
  reactions: Record<string, number>;
  onToggle: (postId: string, emoji: string) => void;
}

export default function ReactionBar({ postId, reactions, onToggle }: ReactionBarProps) {
  const mine = getMyReactions(postId);

  return (
    <div className="flex flex-wrap gap-1.5">
      {REACTION_EMOJIS.map((emoji) => {
        const count = reactions[emoji] ?? 0;
        const active = mine.has(emoji);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(postId, emoji)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
              active
                ? "bg-rose-500/20 text-rose-300"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
