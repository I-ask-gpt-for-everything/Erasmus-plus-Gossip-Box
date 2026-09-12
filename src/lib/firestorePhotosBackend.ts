import { addDoc, collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, storage } from "./firebase";
import { PhotoEntry, NewPhotoEntryInput } from "./types";
import { getAuthorId } from "./authorTracker";

interface PhotoEntryDoc {
  username: string;
  text: string;
  photoLink: string | null;
  instagram: string | null;
  photoUrl: string | null;
  createdAt: Timestamp;
  authorId?: string;
  deleted?: boolean;
}

function toPhotoEntry(id: string, data: PhotoEntryDoc): PhotoEntry {
  return {
    id,
    username: data.username,
    text: data.text,
    photoLink: data.photoLink,
    instagram: data.instagram,
    photoUrl: data.photoUrl,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    authorId: data.authorId ?? "",
    deleted: data.deleted ?? false,
  };
}

export function firestoreSubscribeToPhotoEntries(
  callback: (entries: PhotoEntry[]) => void
): () => void {
  const q = query(collection(db!, "photoEntries"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((d) => toPhotoEntry(d.id, d.data() as PhotoEntryDoc))
          .filter((e) => !e.deleted)
      );
    },
    (error) => {
      console.error("firestoreSubscribeToPhotoEntries listener error:", error);
    }
  );
}

export async function firestoreCreatePhotoEntry(input: NewPhotoEntryInput): Promise<void> {
  let photoUrl: string | null = null;

  if (input.photoDataUrl) {
    const photoRef = ref(storage!, `photo-entries/${crypto.randomUUID()}`);
    await uploadString(photoRef, input.photoDataUrl, "data_url");
    photoUrl = await getDownloadURL(photoRef);
  }

  await addDoc(collection(db!, "photoEntries"), {
    username: input.username,
    text: input.text,
    photoLink: input.photoLink,
    instagram: input.instagram,
    photoUrl,
    createdAt: Timestamp.fromMillis(Date.now()),
    authorId: getAuthorId(),
  } satisfies PhotoEntryDoc);
}

export async function firestoreUpdatePhotoEntry(
  id: string,
  input: NewPhotoEntryInput
): Promise<void> {
  let photoUrl: string | null;

  if (input.photoDataUrl === null) {
    photoUrl = null;
  } else if (input.photoDataUrl.startsWith("data:")) {
    const photoRef = ref(storage!, `photo-entries/${crypto.randomUUID()}`);
    await uploadString(photoRef, input.photoDataUrl, "data_url");
    photoUrl = await getDownloadURL(photoRef);
  } else {
    photoUrl = input.photoDataUrl;
  }

  await updateDoc(doc(db!, "photoEntries", id), {
    username: input.username,
    text: input.text,
    photoLink: input.photoLink,
    instagram: input.instagram,
    photoUrl,
  });
}

export async function firestoreDeletePhotoEntry(id: string): Promise<void> {
  await updateDoc(doc(db!, "photoEntries", id), { deleted: true });
}
