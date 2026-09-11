import Image from "next/image";
import { GossipPost, REACTION_EMOJIS } from "@/lib/types";

interface PrintableGossipsProps {
  posts: GossipPost[];
}

// Print-only view, meant to be rendered as a top-level sibling of the
// (print:hidden) on-screen UI, not nested inside it — nesting lets the dark
// app background leak into the printed page. Shown exclusively when
// printing, independent of which screen/tab produced the selection.
export default function PrintableGossips({ posts }: PrintableGossipsProps) {
  return (
    <div className="hidden print:block bg-white p-8 text-black">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">💌 GossipBox Memories</h1>
        <p className="text-sm text-neutral-500">
          {posts.length} gossip{posts.length === 1 ? "" : "s"} · printed{" "}
          {new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-sm text-neutral-400">No gossips selected.</p>
      ) : (
        posts.map((post) => {
          // Canonical order (matches ReactionBar.tsx), not raw object
          // insertion order — keeps output consistent across posts/printers.
          const reactionEntries = REACTION_EMOJIS.map(
            (emoji) => [emoji, post.reactions[emoji] ?? 0] as const
          ).filter(([, count]) => count > 0);
          const hasFooter = reactionEntries.length > 0 || post.comments.length > 0;

          return (
            <div
              key={post.id}
              className="mb-6 break-inside-avoid rounded-2xl border border-neutral-300 p-5"
            >
              <div className="mb-3 flex items-center justify-between text-xs text-neutral-400">
                <span>
                  {new Date(post.createdAt).toLocaleString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
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
                  className="mb-3 max-h-80 w-full rounded-xl object-contain"
                />
              )}
              <p className="whitespace-pre-wrap text-base leading-relaxed text-neutral-900">
                {post.text}
              </p>

              {hasFooter && (
                <div className="mt-4 border-t border-neutral-200 pt-3">
                  {reactionEntries.length > 0 && (
                    <p className="text-sm text-neutral-500">
                      {reactionEntries.map(([emoji, count]) => `${emoji} ${count}`).join("   ")}
                    </p>
                  )}
                  {post.comments.length > 0 && (
                    <div className={reactionEntries.length > 0 ? "mt-3" : ""}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
                        💬 {post.comments.length} comment
                        {post.comments.length === 1 ? "" : "s"}
                      </p>
                      <ul className="list-disc space-y-1.5 pl-4">
                        {post.comments.map((comment) => (
                          <li
                            key={comment.id}
                            className="whitespace-pre-wrap text-sm leading-snug text-neutral-700"
                          >
                            {comment.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
