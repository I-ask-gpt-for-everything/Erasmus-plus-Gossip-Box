import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { v4 as uuid } from "uuid";
import { storage } from "./firebase";

// Resolves the photo field a compose modal submits into the `photoUrl` value
// to store, for both create and edit on Kind Words and Photos & Personal Info.
// Three outcomes, matching what the modals can hand over:
//
//   - nothing (null, or the empty string a cleared field can produce) → null,
//     clearing any existing picture
//   - a `data:` URL → a fresh pick from the file input, uploaded to Storage
//   - anything else → the untouched existing https:// download URL, passed
//     through rather than re-uploaded
//
// Replaced images are deliberately never deleted from Storage, matching the
// no-cleanup posture documented alongside the rest of this app's media.
export async function resolvePhotoUrl(
  photoDataUrl: string | null,
  pathPrefix: string
): Promise<string | null> {
  if (!photoDataUrl) return null;
  if (!photoDataUrl.startsWith("data:")) return photoDataUrl;

  const photoRef = ref(storage!, `${pathPrefix}/${uuid()}`);
  await uploadString(photoRef, photoDataUrl, "data_url");
  return getDownloadURL(photoRef);
}
