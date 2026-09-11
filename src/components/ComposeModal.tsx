"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { NewPostInput } from "@/lib/types";
import EmojiPicker from "./EmojiPicker";

const MAX_LENGTH = 280;

interface ComposeModalProps {
  onClose: () => void;
  onSubmit: (input: NewPostInput) => Promise<void>;
  requireApproval: boolean;
}

export default function ComposeModal({
  onClose,
  onSubmit,
  requireApproval,
}: ComposeModalProps) {
  const [text, setText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [nsfw, setNsfw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = text.trim().length > 0 && text.length <= MAX_LENGTH && !submitting;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleEmojiSelect(emoji: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? text.length;
    const end = textarea?.selectionEnd ?? text.length;
    const next = (text.slice(0, start) + emoji + text.slice(end)).slice(0, MAX_LENGTH);
    setText(next);

    requestAnimationFrame(() => {
      textarea?.focus();
      const cursor = Math.min(start + emoji.length, MAX_LENGTH);
      textarea?.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ text: text.trim(), imageDataUrl, nsfw });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-white/10 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Spill the tea 🍵</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <textarea
          ref={textareaRef}
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          placeholder="Say it anonymously…"
          rows={4}
          className="w-full resize-none rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
        />
        <div className="flex items-center justify-between">
          <EmojiPicker onSelect={handleEmojiSelect} />
          <span className="text-xs text-white/40">
            {text.length}/{MAX_LENGTH}
          </span>
        </div>

        {imageDataUrl ? (
          <div className="relative">
            <Image
              src={imageDataUrl}
              alt="Selected"
              width={600}
              height={400}
              unoptimized
              className="w-full max-h-56 object-cover rounded-xl"
            />
            <button
              onClick={() => {
                setImageDataUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 rounded-full bg-black/70 text-white text-xs px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/50 hover:border-white/40 hover:text-white/70 transition-colors"
          >
            + Add an image (optional)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={nsfw}
            onChange={(e) => setNsfw(e.target.checked)}
            className="h-4 w-4 rounded accent-rose-500"
          />
          Mark as NSFW
        </label>

        {requireApproval && (
          <p className="text-xs text-amber-300/80">
            🛡️ Gossips are reviewed by an admin before they go public.
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-2 w-full rounded-xl bg-rose-500 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-400 transition-colors"
        >
          {submitting ? "Posting…" : "Post anonymously"}
        </button>
      </div>
    </div>
  );
}
