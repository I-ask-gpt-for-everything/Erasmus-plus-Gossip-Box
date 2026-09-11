"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import PostCard from "./PostCard";
import ComposeModal from "./ComposeModal";
import PrintableGossips from "./PrintableGossips";
import { DEFAULT_MODERATION_SETTINGS, GossipPost, NewPostInput } from "@/lib/types";
import {
  subscribeToPosts,
  subscribeModerationSettings,
  createPost,
  toggleReaction,
  addComment,
} from "@/lib/postsStore";
import { isWithinVisibilityWindow, minutesToTimeString } from "@/lib/time";

export default function GossipFeed() {
  const [posts, setPosts] = useState<GossipPost[]>([]);
  const [showNsfw, setShowNsfw] = useState(false);
  const [composing, setComposing] = useState(false);
  const [moderation, setModeration] = useState(DEFAULT_MODERATION_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());

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

  // Re-check the visibility window periodically so the feed opens/closes
  // live without requiring a page reload as the clock crosses a boundary.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(input: NewPostInput) {
    await createPost(input);
    setToast(
      moderation.requireApproval
        ? "Submitted — awaiting admin approval."
        : "Your gossip is live!"
    );
  }

  const windowOpen = isWithinVisibilityWindow(moderation.visibilityWindow, now);
  const visiblePosts = useMemo(
    () => (windowOpen ? posts.filter((p) => showNsfw || !p.nsfw) : []),
    [windowOpen, posts, showNsfw]
  );

  const printPosts = useMemo(
    () => visiblePosts.filter((p) => selectedForPrint.has(p.id)),
    [visiblePosts, selectedForPrint]
  );

  function toggleSelectForPrint(id: string) {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePrintMode(value: boolean) {
    setPrintMode(value);
    if (!value) setSelectedForPrint(new Set());
  }

  return (
    <>
      <div className="print:hidden min-h-screen bg-neutral-950 flex flex-col">
        <Header
          showNsfw={showNsfw}
          onToggleNsfw={setShowNsfw}
          printMode={printMode}
          onTogglePrint={togglePrintMode}
        />

        {toast && (
          <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-800 border border-white/10 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}

        {printMode && (
          <div className="sticky top-[73px] z-20 border-b border-white/10 bg-neutral-900/95 backdrop-blur-md px-4 py-2">
            <div className="mx-auto flex max-w-3xl items-center gap-2 text-xs">
              <span className="text-white/50">{selectedForPrint.size} selected</span>
              <button
                onClick={() =>
                  setSelectedForPrint(new Set(visiblePosts.map((p) => p.id)))
                }
                className="rounded-full border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/10"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedForPrint(new Set())}
                className="rounded-full border border-white/10 px-2.5 py-1 text-white/60 hover:bg-white/10"
              >
                Clear
              </button>
              <button
                onClick={() => window.print()}
                disabled={printPosts.length === 0}
                className="ml-auto rounded-full bg-rose-500/20 px-3 py-1 font-medium text-rose-300 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Print {printPosts.length}
              </button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-3xl px-4 py-6 flex-1 w-full">
          {!windowOpen ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-white/40">
              <span className="text-4xl">🕒</span>
              <p className="text-sm">
                Gossips are visible {minutesToTimeString(moderation.visibilityWindow.startMinutes)}–
                {minutesToTimeString(moderation.visibilityWindow.endMinutes)} (Gothenburg time).
                Check back soon!
              </p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-white/40">
              <span className="text-4xl">🫙</span>
              <p className="text-sm">No gossip yet. Be the first to spill something.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 gap-4">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={toggleReaction}
                  onAddComment={addComment}
                  selectable={printMode}
                  selected={selectedForPrint.has(post.id)}
                  onToggleSelect={toggleSelectForPrint}
                />
              ))}
            </div>
          )}
        </main>

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

      <PrintableGossips posts={printPosts} />
    </>
  );
}
