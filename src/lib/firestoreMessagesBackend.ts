import { addDoc, collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { db, storage } from "./firebase";
import { KindMessage, NewMessageInput } from "./types";

interface MessageDoc {
  name: string;
  photoUrl: string | null;
  text: string;
  createdAt: Timestamp;
}

function toMessage(id: string, data: MessageDoc): KindMessage {
  return {
    id,
    name: data.name,
    photoUrl: data.photoUrl,
    text: data.text,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
  };
}

export function firestoreSubscribeToMessages(
  callback: (messages: KindMessage[]) => void
): () => void {
  const q = query(collection(db!, "messages"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => toMessage(d.id, d.data() as MessageDoc)));
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
  } satisfies MessageDoc);
}
