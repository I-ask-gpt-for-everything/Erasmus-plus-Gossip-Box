import { v4 as uuid } from "uuid";
import { PhotoEntry, NewPhotoEntryInput } from "./types";
import { getAuthorId } from "./authorTracker";

const PHOTO_ENTRIES_KEY = "gossipbox_photo_entries";

const bus = new EventTarget();

function readEntries(): PhotoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PHOTO_ENTRIES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as PhotoEntry[]).map((e) => ({
      ...e,
      authorId: e.authorId ?? "",
      deleted: e.deleted ?? false,
    }));
  } catch {
    return [];
  }
}

function writeEntries(entries: PhotoEntry[]) {
  window.localStorage.setItem(PHOTO_ENTRIES_KEY, JSON.stringify(entries));
  bus.dispatchEvent(new Event("change"));
}

function emit(callback: (entries: PhotoEntry[]) => void) {
  const entries = readEntries()
    .filter((e) => !e.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);
  callback(entries);
}

export function localSubscribeToPhotoEntries(
  callback: (entries: PhotoEntry[]) => void
): () => void {
  emit(callback);
  const handler = () => emit(callback);
  bus.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    bus.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function localCreatePhotoEntry(input: NewPhotoEntryInput): Promise<void> {
  const entry: PhotoEntry = {
    id: uuid(),
    username: input.username,
    text: input.text,
    photoLink: input.photoLink,
    instagram: input.instagram,
    photoUrl: input.photoDataUrl,
    createdAt: Date.now(),
    authorId: getAuthorId(),
  };
  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries);
}

export async function localUpdatePhotoEntry(
  id: string,
  input: NewPhotoEntryInput
): Promise<void> {
  const entries = readEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.username = input.username;
  entry.text = input.text;
  entry.photoLink = input.photoLink;
  entry.instagram = input.instagram;
  entry.photoUrl = input.photoDataUrl;
  writeEntries(entries);
}

export async function localDeletePhotoEntry(id: string): Promise<void> {
  const entries = readEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return;
  entry.deleted = true;
  writeEntries(entries);
}
