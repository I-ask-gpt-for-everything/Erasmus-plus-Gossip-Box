import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { v4 as uuid } from "uuid";
import { storage } from "./firebase";

// Resolves the image field a compose modal submits into the URL to store —
// `imageUrl` on a gossip post, `photoUrl` on a Kind Words message or a Photos
// & Personal Info entry. Every Firestore create and edit path goes through
// here. Three outcomes, matching what the modals can hand over:
//
//   - nothing (null, or the empty string a cleared field can produce) → null,
//     clearing any existing picture
//   - a `data:` URL → a fresh pick from the file input, uploaded to Storage
//   - anything else → the untouched existing https:// download URL, passed
//     through rather than re-uploaded
//
// uuid() rather than crypto.randomUUID() for the object name: the latter is
// undefined outside a secure context, so it throws when the app is opened over
// plain http — e.g. from a phone at http://192.168.x.x during testing — which
// silently broke every image upload on that connection.
//
// Replaced images are deliberately never deleted from Storage, matching the
// no-cleanup posture documented alongside the rest of this app's media.
export async function resolveImageUrl(
  imageDataUrl: string | null,
  pathPrefix: string
): Promise<string | null> {
  if (!imageDataUrl) return null;
  if (!imageDataUrl.startsWith("data:")) return imageDataUrl;

  const imageRef = ref(storage!, `${pathPrefix}/${uuid()}`);
  await uploadString(imageRef, imageDataUrl, "data_url");
  return getDownloadURL(imageRef);
}
