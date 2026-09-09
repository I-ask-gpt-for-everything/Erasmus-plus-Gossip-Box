import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db, storage } from "./firebase";
import {
  DEFAULT_MODERATION_SETTINGS,
  GossipPost,
  ModerationSettings,
  NewPostInput,
  PostStatus,
  visibilityToExpiresAt,
} from "./types";
import { toggleMyReaction } from "./reactionTracker";

interface PostDoc {
  text: string;
  imageUrl: string | null;
  nsfw: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp | null;
  status: PostStatus;
  reactions: Record<string, number>;
}

function notLive(post: GossipPost): boolean {
  return post.expiresAt !== null && post.expiresAt < Date.now();
}

function toPost(id: string, data: PostDoc): GossipPost {
  return {
    id,
    text: data.text,
    imageUrl: data.imageUrl,
    nsfw: data.nsfw,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    expiresAt: data.expiresAt ? data.expiresAt.toMillis() : null,
    status: data.status ?? "approved",
    reactions: data.reactions ?? {},
  };
}

export function firestoreSubscribeToPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  const q = query(
    collection(db!, "posts"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs
      .map((d) => toPost(d.id, d.data() as PostDoc))
      .filter((p) => !notLive(p));
    callback(posts);
  });
}

export function firestoreSubscribeToPendingPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  const q = query(
    collection(db!, "posts"),
    where("status", "==", "pending"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => toPost(d.id, d.data() as PostDoc)));
  });
}

async function readModerationSettings(): Promise<ModerationSettings> {
  const snap = await getDoc(doc(db!, "settings", "moderation"));
  if (!snap.exists()) return DEFAULT_MODERATION_SETTINGS;
  return { ...DEFAULT_MODERATION_SETTINGS, ...(snap.data() as ModerationSettings) };
}

export function firestoreSubscribeModerationSettings(
  callback: (settings: ModerationSettings) => void
): () => void {
  return onSnapshot(doc(db!, "settings", "moderation"), (snap) => {
    callback(
      snap.exists()
        ? { ...DEFAULT_MODERATION_SETTINGS, ...(snap.data() as ModerationSettings) }
        : DEFAULT_MODERATION_SETTINGS
    );
  });
}

export async function firestoreSetRequireApproval(value: boolean): Promise<void> {
  await setDoc(
    doc(db!, "settings", "moderation"),
    { requireApproval: value },
    { merge: true }
  );
}

export async function firestoreCreatePost(input: NewPostInput): Promise<void> {
  let imageUrl: string | null = null;

  if (input.imageDataUrl) {
    const imageRef = ref(storage!, `gossip-images/${crypto.randomUUID()}`);
    await uploadString(imageRef, input.imageDataUrl, "data_url");
    imageUrl = await getDownloadURL(imageRef);
  }

  const now = Date.now();
  const expiresAt = visibilityToExpiresAt(input.visibility, now);
  const { requireApproval } = await readModerationSettings();

  await addDoc(collection(db!, "posts"), {
    text: input.text,
    imageUrl,
    nsfw: input.nsfw,
    createdAt: Timestamp.fromMillis(now),
    expiresAt: expiresAt ? Timestamp.fromMillis(expiresAt) : null,
    status: requireApproval ? "pending" : "approved",
    reactions: {},
  } satisfies PostDoc);
}

export async function firestoreToggleReaction(
  postId: string,
  emoji: string
): Promise<void> {
  const nowActive = toggleMyReaction(postId, emoji);
  const snap = await getDoc(doc(db!, "posts", postId));
  if (!snap.exists()) return;
  const current = ((snap.data() as PostDoc).reactions ?? {})[emoji] ?? 0;
  const next = Math.max(0, current + (nowActive ? 1 : -1));
  await updateDoc(doc(db!, "posts", postId), {
    [`reactions.${emoji}`]: next,
  });
}

export async function firestoreSetPostStatus(
  postId: string,
  status: "approved" | "rejected"
): Promise<void> {
  await updateDoc(doc(db!, "posts", postId), { status });
}

// --- Admin auth (Firebase Authentication + an `admins/{uid}` allowlist doc) ---

export async function firestoreAdminLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const credential = await signInWithEmailAndPassword(auth!, email, password);
    const adminDoc = await getDoc(doc(db!, "admins", credential.user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth!);
      return { ok: false, error: "This account is not an approved admin." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function firestoreAdminLogout(): Promise<void> {
  await signOut(auth!);
}

export function firestoreSubscribeAdminSession(
  callback: (isAdmin: boolean) => void
): () => void {
  return onAuthStateChanged(auth!, async (user) => {
    if (!user) {
      callback(false);
      return;
    }
    const adminDoc = await getDoc(doc(db!, "admins", user.uid));
    callback(adminDoc.exists());
  });
}
