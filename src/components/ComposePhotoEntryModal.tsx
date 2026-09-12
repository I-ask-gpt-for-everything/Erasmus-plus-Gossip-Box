"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  MAX_PHOTO_ENTRY_TEXT_LENGTH,
  MAX_PHOTO_ENTRY_USERNAME_LENGTH,
  MAX_PHOTO_LINK_LENGTH,
  MAX_INSTAGRAM_HANDLE_LENGTH,
  NewPhotoEntryInput,
  PhotoEntry,
} from "@/lib/types";

interface ComposePhotoEntryModalProps {
  onClose: () => void;
  onSubmit: (input: NewPhotoEntryInput) => Promise<void>;
  initialValue?: PhotoEntry;
}

export default function ComposePhotoEntryModal({
  onClose,
  onSubmit,
  initialValue,
}: ComposePhotoEntryModalProps) {
  const isEditing = !!initialValue;
  const [username, setUsername] = useState(initialValue?.username ?? "");
  const [text, setText] = useState(initialValue?.text ?? "");
  const [photoLink, setPhotoLink] = useState(initialValue?.photoLink ?? "");
  const [instagram, setInstagram] = useState(initialValue?.instagram ?? "");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(
    initialValue?.photoUrl ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    username.trim().length > 0 &&
    (text.trim().length > 0 || photoLink.trim().length > 0 || !!photoDataUrl) &&
    text.length <= MAX_PHOTO_ENTRY_TEXT_LENGTH &&
    !submitting;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({
        username: username.trim(),
        text: text.trim(),
        photoLink: photoLink.trim() || null,
        instagram: instagram.trim() || null,
        photoDataUrl,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-neutral-900 border border-white/10 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? "Edit your entry" : "Share photos & info 📸"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50" htmlFor="photo-entry-username">
            Your username
          </label>
          <input
            id="photo-entry-username"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, MAX_PHOTO_ENTRY_USERNAME_LENGTH))}
            placeholder="e.g. Alex"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/50" htmlFor="photo-entry-text">
              Message (optional)
            </label>
            <span className="text-xs text-white/40">
              {text.length}/{MAX_PHOTO_ENTRY_TEXT_LENGTH}
            </span>
          </div>
          <textarea
            id="photo-entry-text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_PHOTO_ENTRY_TEXT_LENGTH))}
            placeholder="Say something…"
            rows={4}
            className="w-full resize-none rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50" htmlFor="photo-entry-link">
            Photo link (optional)
          </label>
          <input
            id="photo-entry-link"
            type="url"
            value={photoLink}
            onChange={(e) => setPhotoLink(e.target.value.slice(0, MAX_PHOTO_LINK_LENGTH))}
            placeholder="https://…"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-white/50" htmlFor="photo-entry-instagram">
            Instagram (optional)
          </label>
          <input
            id="photo-entry-instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value.slice(0, MAX_INSTAGRAM_HANDLE_LENGTH))}
            placeholder="@yourhandle"
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
        </div>

        {photoDataUrl ? (
          <div className="flex items-center gap-3">
            <Image
              src={photoDataUrl}
              alt="Selected"
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-full object-cover"
            />
            <button
              onClick={() => {
                setPhotoDataUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-full bg-white/10 text-white text-xs px-3 py-1.5 hover:bg-white/20"
            >
              Remove picture
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-dashed border-white/20 py-3 text-sm text-white/50 hover:border-white/40 hover:text-white/70 transition-colors"
          >
            + Add a picture (optional)
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-2 w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-400 transition-colors"
        >
          {submitting ? "Saving…" : isEditing ? "Save changes" : "Post"}
        </button>
      </div>
    </div>
  );
}
