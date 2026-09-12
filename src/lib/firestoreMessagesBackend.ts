import { addDoc, collection, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, storage } from "./firebase";
import { KindMessage, NewMessageInput } from "./types";
import { getAuthorId } from "./authorTracker";

interface MessageDoc {
  name: string;
  photoUrl: string | null;
  text: string;
  createdAt: Timestamp;
  authorId?: string;
  deleted?: boolean;
}

function toMessage(id: string, data: MessageDoc): KindMessage {
  return {
    id,
    name: data.name,
    photoUrl: data.photoUrl,
    text: data.text,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    authorId: data.authorId ?? "",
    deleted: data.deleted ?? false,
  };
}

export function firestoreSubscribeToMessages(
  callback: (messages: KindMessage[]) => void
): () => void {
  const q = query(collection(db!, "messages"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs
          .map((d) => toMessage(d.id, d.data() as MessageDoc))
          .filter((m) => !m.deleted)
      );
    },
    (error) => {
      console.error("firestoreSubscribeToMessages listener error:", error);
    }
  );
}

export async function firestoreCreateMessage(input: NewMessageInput): Promise<void> {
  let photoUrl: string | null = null;

  if (input.photoDataUrl) {
    const photoRef = ref(storage!, `message-photos/${crypto.randomUUID()}`);
    await uploadString(photoRef, input.photoDataUrl, "data_url");
    photoUrl = await getDownloadURL(photoRef);
  }

  await addDoc(collection(db!, "messages"), {
    name: input.name,
    photoUrl,
    text: input.text,
    createdAt: Timestamp.fromMillis(Date.now()),
    authorId: getAuthorId(),
  } satisfies MessageDoc);
}

export async function firestoreUpdateMessage(id: string, input: NewMessageInput): Promise<void> {
  let photoUrl: string | null;

  if (input.photoDataUrl === null) {
    photoUrl = null;
  } else if (input.photoDataUrl.startsWith("data:")) {
    const photoRef = ref(storage!, `message-photos/${crypto.randomUUID()}`);
    await uploadString(photoRef, input.photoDataUrl, "data_url");
    photoUrl = await getDownloadURL(photoRef);
  } else {
    photoUrl = input.photoDataUrl;
  }

  await updateDoc(doc(db!, "messages", id), {
    name: input.name,
    text: input.text,
    photoUrl,
  });
}

export async function firestoreDeleteMessage(id: string): Promise<void> {
  await updateDoc(doc(db!, "messages", id), { deleted: true });
}
