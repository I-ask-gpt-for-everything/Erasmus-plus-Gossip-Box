"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DEFAULT_MODERATION_SETTINGS, GossipPost, PostStatus } from "@/lib/types";
import {
  subscribeToAllPosts,
  subscribeModerationSettings,
  setRequireApproval,
  approvePost,
  rejectPost,
} from "@/lib/postsStore";
import { adminLogout } from "@/lib/adminAuth";
import { formatRelativeTime } from "@/lib/time";

type TabId = "overview" | "pending" | "all" | "settings";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pending", label: "Pending" },
  { id: "all", label: "All gossips" },
  { id: "settings", label: "Settings" },
];

type PrintFilter = PostStatus | "all";

const PRINT_FILTER_LABELS: Record<PrintFilter, string> = {
  all: "All gossips",
  pending: "Pending only",
  approved: "Approved only",
  rejected: "Rejected only",
};

function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    approved: "bg-emerald-500/20 text-emerald-300",
    rejected: "bg-rose-500/20 text-rose-300",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [allPosts, setAllPosts] = useState<GossipPost[]>([]);
  const [moderation, setModeration] = useState(DEFAULT_MODERATION_SETTINGS);
  const [allFilter, setAllFilter] = useState<PrintFilter>("all");
  const [printFilter, setPrintFilter] = useState<PrintFilter>("approved");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => subscribeToAllPosts(setAllPosts), []);
  useEffect(() => subscribeModerationSettings(setModeration), []);

  const pending = useMemo(
    () =>
      allPosts
        .filter((p) => p.status === "pending")
        .sort((a, b) => a.createdAt - b.createdAt),
    [allPosts]
  );

  const stats = useMemo(
    () => ({
      total: allPosts.length,
      pending: allPosts.filter((p) => p.status === "pending").length,
      approved: allPosts.filter((p) => p.status === "approved").length,
      rejected: allPosts.filter((p) => p.status === "rejected").length,
      nsfw: allPosts.filter((p) => p.nsfw).length,
    }),
    [allPosts]
  );

  const filteredAll = useMemo(
    () =>
      allFilter === "all" ? allPosts : allPosts.filter((p) => p.status === allFilter),
    [allPosts, allFilter]
  );

  const printCandidates = useMemo(
    () =>
      printFilter === "all" ? allPosts : allPosts.filter((p) => p.status === printFilter),
    [allPosts, printFilter]
  );

  const printPosts = useMemo(
    () => allPosts.filter((p) => selectedIds.has(p.id)),
    [allPosts, selectedIds]
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllCandidates() {
    setSelectedIds((prev) => new Set([...prev, ...printCandidates.map((p) => p.id)]));
  }

  return (
    <>
      <div className="print:hidden min-h-screen bg-neutral-950 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Admin dashboard</h1>
              <p className="text-xs text-white/40">GossipBox moderation</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs text-white/50 hover:text-white"
              >
                ← Back to app
              </Link>
              <button
                onClick={() => adminLogout()}
                className="text-xs text-white/50 hover:text-white"
              >
                Sign out
              </button>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-rose-500/20 text-rose-300"
                    : "text-white/60 hover:bg-white/10"
                }`}
              >
                {tab.label}
                {tab.id === "pending" && pending.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-rose-500/30 px-1.5 py-0.5 text-[10px] text-rose-200">
                    {pending.length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <section className="grid grid-cols-2 gap-3">
              <StatCard label="Total gossips" value={stats.total} />
              <StatCard label="Pending review" value={stats.pending} accent="text-amber-300" />
              <StatCard label="Approved" value={stats.approved} accent="text-emerald-300" />
              <StatCard label="Rejected" value={stats.rejected} accent="text-rose-300" />
              <StatCard label="Flagged NSFW" value={stats.nsfw} className="col-span-2" />
            </section>
          )}

          {activeTab === "pending" && (
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
          )}

          {activeTab === "all" && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">
                  All gossips {filteredAll.length > 0 && `(${filteredAll.length})`}
                </h2>
                <select
                  value={allFilter}
                  onChange={(e) => setAllFilter(e.target.value as PrintFilter)}
                  className="rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 text-xs text-white/70"
                >
                  {(Object.keys(PRINT_FILTER_LABELS) as PrintFilter[]).map((key) => (
                    <option key={key} value={key}>
                      {PRINT_FILTER_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              {filteredAll.length === 0 ? (
                <p className="text-sm text-white/40">No gossips match this filter.</p>
              ) : (
                filteredAll.map((post) => (
                  <div
                    key={post.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <StatusBadge status={post.status} />
                      {post.nsfw && (
                        <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-300">
                          NSFW
                        </span>
                      )}
                      <span className="ml-auto">{formatRelativeTime(post.createdAt)}</span>
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
                      {post.status !== "approved" && (
                        <button
                          onClick={() => approvePost(post.id)}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                        >
                          Approve
                        </button>
                      )}
                      {post.status !== "rejected" && (
                        <button
                          onClick={() => rejectPost(post.id)}
                          className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/30"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <section className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-2 text-sm font-semibold text-white">Moderation</h2>
                <label className="flex items-center justify-between gap-4 text-sm text-white/70">
                  <span>Require approval before a gossip goes public</span>
                  <input
                    type="checkbox"
                    checked={moderation.requireApproval}
                    onChange={(e) => setRequireApproval(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded accent-rose-500"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-1 text-sm font-semibold text-white">Print memories</h2>
                <p className="mb-3 text-xs text-white/40">
                  Pick specific gossips and print them as a nicely formatted
                  keepsake page — photos and reactions included.
                </p>

                <div className="mb-2 flex items-center gap-2">
                  <select
                    value={printFilter}
                    onChange={(e) => setPrintFilter(e.target.value as PrintFilter)}
                    className="flex-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 text-xs text-white/70"
                  >
                    {(Object.keys(PRINT_FILTER_LABELS) as PrintFilter[]).map((key) => (
                      <option key={key} value={key}>
                        {PRINT_FILTER_LABELS[key]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={selectAllCandidates}
                    className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-white/60 hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>

                <div className="max-h-56 divide-y divide-white/5 overflow-y-auto rounded-lg border border-white/10">
                  {printCandidates.length === 0 ? (
                    <p className="p-3 text-xs text-white/30">No gossips match this filter.</p>
                  ) : (
                    printCandidates.map((post) => (
                      <label
                        key={post.id}
                        className="flex items-start gap-2 p-2 text-xs text-white/70 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(post.id)}
                          onChange={() => toggleSelected(post.id)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded accent-rose-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{post.text}</span>
                          <span className="block text-[10px] text-white/30">
                            {formatRelativeTime(post.createdAt)} · {post.status}
                            {post.nsfw ? " · NSFW" : ""}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <button
                  onClick={() => window.print()}
                  disabled={printPosts.length === 0}
                  className="mt-3 w-full rounded-lg bg-rose-500/20 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Print {printPosts.length} gossip{printPosts.length === 1 ? "" : "s"}
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h2 className="mb-1 text-sm font-semibold text-white">More settings coming soon</h2>
                <p className="text-xs text-white/40">
                  This tab bar is where future admin sections (like a contact
                  information page) will live alongside moderation.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Print-only view: a top-level sibling of the (print:hidden) dashboard
          shell, not nested inside it, so none of the shell's dark background
          or padding can leak into the printed page. Rendered off-screen and
          shown exclusively when printing, independent of which tab is active,
          so the "Print" button in Settings always produces the right output
          regardless of on-screen state. */}
      <div className="hidden print:block bg-white p-8 text-black">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">💌 GossipBox Memories</h1>
          <p className="text-sm text-neutral-500">
            {printPosts.length} gossip{printPosts.length === 1 ? "" : "s"} · printed{" "}
            {new Date().toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {printPosts.length === 0 ? (
          <p className="text-center text-sm text-neutral-400">No gossips selected.</p>
        ) : (
          printPosts.map((post) => {
            const reactionEntries = Object.entries(post.reactions).filter(
              ([, count]) => count > 0
            );
            return (
              <div
                key={post.id}
                className="mb-6 break-inside-avoid rounded-2xl border border-neutral-300 p-5"
              >
                <div className="mb-3 flex items-center justify-between text-xs text-neutral-400">
                  <span>
                    {new Date(post.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                  {post.nsfw && (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                      NSFW
                    </span>
                  )}
                </div>
                {post.imageUrl && (
                  <Image
                    src={post.imageUrl}
                    alt=""
                    width={800}
                    height={500}
                    unoptimized
                    className="mb-3 max-h-80 w-full rounded-xl object-cover"
                  />
                )}
                <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-900">
                  {post.text}
                </p>
                {reactionEntries.length > 0 && (
                  <p className="mt-3 text-sm text-neutral-500">
                    {reactionEntries.map(([emoji, count]) => `${emoji} ${count}`).join("   ")}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: number;
  accent?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${className ?? ""}`}
    >
      <div className={`text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
      <div className="text-xs text-white/40">{label}</div>
    </div>
  );
}
