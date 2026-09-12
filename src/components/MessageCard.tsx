"use client";

import Image from "next/image";
import { KindMessage } from "@/lib/types";
import { formatRelativeTime } from "@/lib/time";

interface MessageCardProps {
  message: KindMessage;
  isOwner: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MessageCard({
  message,
  isOwner,
  isAdmin,
  onEdit,
  onDelete,
}: MessageCardProps) {
  const initial = message.name.trim().charAt(0).toUpperCase() || "?";
  const canManage = isOwner || isAdmin;

  function handleDelete() {
    if (window.confirm("Delete this message? This can't be undone.")) {
      onDelete();
    }
  }

  return (
    <article className="break-inside-avoid mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 flex flex-col gap-3 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        {message.photoUrl ? (
          <Image
            src={message.photoUrl}
            alt=""
            width={40}
            height={40}
            unoptimized
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-sm font-semibold text-rose-300">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{message.name}</p>
          <p className="text-xs text-white/40">{formatRelativeTime(message.createdAt)}</p>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
              aria-label="Edit message"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-red-300 transition-colors"
              aria-label="Delete message"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
        {message.text}
      </p>
    </article>
  );
}
