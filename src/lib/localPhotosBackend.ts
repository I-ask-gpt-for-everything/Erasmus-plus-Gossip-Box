import { v4 as uuid } from "uuid";
import { PhotoEntry, NewPhotoEntryInput } from "./types";

const PHOTO_ENTRIES_KEY = "gossipbox_photo_entries";

const bus = new EventTarget();

function readEntries(): PhotoEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PHOTO_ENTRIES_KEY);
    return raw ? (JSON.parse(raw) as PhotoEntry[]) : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: PhotoEntry[]) {
  window.localStorage.setItem(PHOTO_ENTRIES_KEY, JSON.stringify(entries));
  bus.dispatchEvent(new Event("change"));
}

function emit(callback: (entries: PhotoEntry[]) => void) {
  const entries = readEntries().sort((a, b) => b.createdAt - a.createdAt);
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
  };
  const entries = readEntries();
  entries.push(entry);
  writeEntries(entries);
}
