import { isFirebaseConfigured } from "./firebase";
import { PhotoEntry, NewPhotoEntryInput } from "./types";
import {
  localSubscribeToPhotoEntries,
  localCreatePhotoEntry,
  localUpdatePhotoEntry,
  localDeletePhotoEntry,
} from "./localPhotosBackend";
import {
  firestoreSubscribeToPhotoEntries,
  firestoreCreatePhotoEntry,
  firestoreUpdatePhotoEntry,
  firestoreDeletePhotoEntry,
} from "./firestorePhotosBackend";

export { getAuthorId } from "./authorTracker";
export { isFirebaseConfigured };

export function subscribeToPhotoEntries(
  callback: (entries: PhotoEntry[]) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeToPhotoEntries(callback)
    : localSubscribeToPhotoEntries(callback);
}

export function createPhotoEntry(input: NewPhotoEntryInput): Promise<void> {
  return isFirebaseConfigured
    ? firestoreCreatePhotoEntry(input)
    : localCreatePhotoEntry(input);
}

export function updatePhotoEntry(id: string, input: NewPhotoEntryInput): Promise<void> {
  return isFirebaseConfigured
    ? firestoreUpdatePhotoEntry(id, input)
    : localUpdatePhotoEntry(id, input);
}

export function deletePhotoEntry(id: string): Promise<void> {
  return isFirebaseConfigured
    ? firestoreDeletePhotoEntry(id)
    : localDeletePhotoEntry(id);
}
