"use client";

import { useState } from "react";
import { GossipComment, MAX_COMMENT_LENGTH } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";

interface CommentSectionProps {
  postId: string;
  comments: GossipComment[];
  onAddComment: (postId: string, text: string) => Promise<void>;
}

export default function CommentSection({
  postId,
  comments,
  onAddComment,
}: CommentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(postId, text);
      setDraft("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="self-start text-xs text-white/50 hover:text-white"
      >
        💬{" "}
        {comments.length > 0
          ? `${comments.length} comment${comments.length === 1 ? "" : "s"}`
          : "Comment"}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 rounded-xl bg-black/20 p-3">
          {comments.length > 0 && (
            <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="text-xs">
                  <span className="text-white/30">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                  <p className="whitespace-pre-wrap text-white/80">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/30"
            />
            <button
              onClick={handleSubmit}
              disabled={!draft.trim() || submitting}
              className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
