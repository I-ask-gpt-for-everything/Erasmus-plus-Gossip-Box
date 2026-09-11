import { isFirebaseConfigured } from "./firebase";
import { PhotoEntry, NewPhotoEntryInput } from "./types";
import {
  localSubscribeToPhotoEntries,
  localCreatePhotoEntry,
} from "./localPhotosBackend";
import {
  firestoreSubscribeToPhotoEntries,
  firestoreCreatePhotoEntry,
} from "./firestorePhotosBackend";

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
