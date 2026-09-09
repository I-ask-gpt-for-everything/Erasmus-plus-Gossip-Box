"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DEFAULT_MODERATION_SETTINGS, GossipPost } from "@/lib/types";
import {
  subscribeToPendingPosts,
  subscribeModerationSettings,
  setRequireApproval,
  approvePost,
  rejectPost,
} from "@/lib/postsStore";
import { adminLogout } from "@/lib/adminAuth";
import { formatRelativeTime } from "@/lib/time";

export default function AdminPanel() {
  const [pending, setPending] = useState<GossipPost[]>([]);
  const [moderation, setModeration] = useState(DEFAULT_MODERATION_SETTINGS);

  useEffect(() => subscribeToPendingPosts(setPending), []);
  useEffect(() => subscribeModerationSettings(setModeration), []);

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-6">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <button
            onClick={() => adminLogout()}
            className="text-xs text-white/50 hover:text-white"
          >
            Sign out
          </button>
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-2 text-sm font-semibold text-white">Settings</h2>
          <label className="flex items-center justify-between gap-4 text-sm text-white/70">
            <span>Require approval before a gossip goes public</span>
            <input
              type="checkbox"
              checked={moderation.requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="h-4 w-4 shrink-0 rounded accent-rose-500"
            />
          </label>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-white">
            Pending gossips {pending.length > 0 && `(${pending.length})`}
          </h2>

          {pending.length === 0 ? (
            <p className="text-sm text-white/40">Nothing waiting for review.</p>
          ) : (
            pending.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  {post.nsfw && (
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                      NSFW
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm text-white/90">{post.text}</p>
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt=""
                    width={600}
                    height={400}
                    unoptimized
                    className="max-h-56 w-full rounded-xl object-cover"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => approvePost(post.id)}
                    className="flex-1 rounded-lg bg-emerald-500/20 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectPost(post.id)}
                    className="flex-1 rounded-lg bg-rose-500/20 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/30"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
