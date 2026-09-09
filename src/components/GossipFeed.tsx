"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "./Header";
import PostCard from "./PostCard";
import ComposeModal from "./ComposeModal";
import { DEFAULT_MODERATION_SETTINGS, GossipPost, NewPostInput } from "@/lib/types";
import {
  subscribeToPosts,
  subscribeModerationSettings,
  createPost,
  toggleReaction,
  isFirebaseConfigured,
} from "@/lib/postsStore";

export default function GossipFeed() {
  const [posts, setPosts] = useState<GossipPost[]>([]);
  const [showNsfw, setShowNsfw] = useState(false);
  const [composing, setComposing] = useState(false);
  const [moderation, setModeration] = useState(DEFAULT_MODERATION_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts(setPosts);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeModerationSettings(setModeration);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(input: NewPostInput) {
    await createPost(input);
    setToast(
      moderation.requireApproval
        ? "Submitted — awaiting admin approval."
        : "Your gossip is live!"
    );
  }

  const visiblePosts = posts.filter((p) => showNsfw || !p.nsfw);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <Header
        showNsfw={showNsfw}
        onToggleNsfw={setShowNsfw}
        isDemoMode={!isFirebaseConfigured}
      />

      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-800 border border-white/10 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 flex-1 w-full">
        {visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-white/40">
            <span className="text-4xl">🫙</span>
            <p className="text-sm">No gossip yet. Be the first to spill something.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4">
            {visiblePosts.map((post) => (
              <PostCard key={post.id} post={post} onReact={toggleReaction} />
            ))}
          </div>
        )}
      </main>

      <footer className="py-4 text-center">
        <Link href="/admin" className="text-[11px] text-white/20 hover:text-white/40">
          admin
        </Link>
      </footer>

      <button
        onClick={() => setComposing(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 transition-colors"
        aria-label="New gossip"
      >
        +
      </button>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onSubmit={handleSubmit}
          requireApproval={moderation.requireApproval}
        />
      )}
    </div>
  );
}
