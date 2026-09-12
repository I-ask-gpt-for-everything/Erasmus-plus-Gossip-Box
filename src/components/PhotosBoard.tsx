"use client";

import { useEffect, useState } from "react";
import PhotoEntryCard from "./PhotoEntryCard";
import ComposePhotoEntryModal from "./ComposePhotoEntryModal";
import { PhotoEntry, NewPhotoEntryInput } from "@/lib/types";
import {
  subscribeToPhotoEntries,
  createPhotoEntry,
  updatePhotoEntry,
  deletePhotoEntry,
  getAuthorId,
} from "@/lib/photosStore";
import { subscribeAdminSession } from "@/lib/adminAuth";

export default function PhotosBoard() {
  const [entries, setEntries] = useState<PhotoEntry[]>([]);
  const [composing, setComposing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PhotoEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myAuthorId] = useState(() => getAuthorId());

  useEffect(() => subscribeToPhotoEntries(setEntries), []);
  useEffect(() => subscribeAdminSession(setIsAdmin), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(input: NewPhotoEntryInput) {
    if (editingEntry) {
      await updatePhotoEntry(editingEntry.id, input);
      setToast("Entry updated.");
    } else {
      await createPhotoEntry(input);
      setToast("Posted! 📸");
    }
  }

  async function handleDelete(id: string) {
    await deletePhotoEntry(id);
    setToast("Entry deleted.");
  }

  function openCompose() {
    setEditingEntry(null);
    setComposing(true);
  }

  function openEdit(entry: PhotoEntry) {
    setEditingEntry(entry);
    setComposing(true);
  }

  function closeCompose() {
    setComposing(false);
    setEditingEntry(null);
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              📸 Photos & Personal Info
            </h1>
            <p className="text-xs text-white/40">
              Share a photo link, your Instagram, or a picture — with your name on it
            </p>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-800 border border-white/10 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 flex-1 w-full">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-white/40">
            <span className="text-4xl">📸</span>
            <p className="text-sm">Nothing here yet. Be the first to share.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4">
            {entries.map((entry) => (
              <PhotoEntryCard
                key={entry.id}
                entry={entry}
                isOwner={entry.authorId === myAuthorId}
                isAdmin={isAdmin}
                onEdit={() => openEdit(entry)}
                onDelete={() => handleDelete(entry.id)}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={openCompose}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-2xl text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 transition-colors"
        aria-label="New photo entry"
      >
        +
      </button>

      {composing && (
        <ComposePhotoEntryModal
          onClose={closeCompose}
          onSubmit={handleSubmit}
          initialValue={editingEntry ?? undefined}
        />
      )}
    </div>
  );
}
