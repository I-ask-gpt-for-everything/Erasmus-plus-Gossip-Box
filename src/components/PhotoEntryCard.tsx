"use client";

import Image from "next/image";
import { PhotoEntry } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";

interface PhotoEntryCardProps {
  entry: PhotoEntry;
}

function instagramHref(handle: string): string {
  if (handle.startsWith("http://") || handle.startsWith("https://")) return handle;
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export default function PhotoEntryCard({ entry }: PhotoEntryCardProps) {
  const initial = entry.username.trim().charAt(0).toUpperCase() || "?";

  return (
    <article className="break-inside-avoid mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        {entry.photoUrl ? (
          <Image
            src={entry.photoUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-semibold text-sky-300">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{entry.username}</p>
          <p className="text-xs text-white/40">{formatRelativeTime(entry.createdAt)}</p>
        </div>
      </div>

      {entry.text && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
          {entry.text}
        </p>
      )}

      {(entry.photoLink || entry.instagram) && (
        <div className="flex flex-col gap-1 text-xs">
          {entry.photoLink && (
            <a
              href={entry.photoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sky-300 hover:text-sky-200 underline underline-offset-2"
            >
              🔗 {entry.photoLink}
            </a>
          )}
          {entry.instagram && (
            <a
              href={instagramHref(entry.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-pink-300 hover:text-pink-200 underline underline-offset-2"
            >
              📸 {entry.instagram.replace(/^@/, "")}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
