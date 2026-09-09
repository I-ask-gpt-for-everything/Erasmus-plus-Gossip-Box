"use client";

import { useEffect, useRef, useState } from "react";

const EMOJI_GRID = [
  "😀", "😂", "🥹", "😍", "😎", "🤔", "😭", "😡", "🥳", "😴",
  "🙈", "🙉", "🙊", "💀", "👀", "🔥", "💯", "✨", "🎉", "💔",
  "❤️", "🤍", "💅", "🤫", "😬", "🫠", "🫡", "😏", "🤡", "👻",
  "👍", "👎", "🙏", "👏", "🍵", "☕", "🍕", "🍿", "🎬", "📸",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white/70 hover:bg-white/10"
        aria-label="Insert emoji"
      >
        😊
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-2 grid w-64 grid-cols-8 gap-1 rounded-xl border border-white/10 bg-neutral-800 p-2 shadow-xl">
          {EMOJI_GRID.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
              className="rounded-md p-1 text-lg hover:bg-white/10"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
