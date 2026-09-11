import {
  addDoc,
  arrayUnion,
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
  GossipComment,
  GossipPost,
  ModerationSettings,
  NewPostInput,
  PostStatus,
  VisibilitySettings,
} from "./types";
import { toggleMyReaction } from "./reactionTracker";

interface PostDoc {
  text: string;
  imageUrl: string | null;
  nsfw: boolean;
  createdAt: Timestamp;
  status: PostStatus;
  reactions: Record<string, number>;
  comments: GossipComment[];
}

function toPost(id: string, data: PostDoc): GossipPost {
  return {
    id,
    text: data.text,
    imageUrl: data.imageUrl,
    nsfw: data.nsfw,
    createdAt: data.createdAt?.toMillis() ?? Date.now(),
    status: data.status ?? "approved",
    reactions: data.reactions ?? {},
    comments: data.comments ?? [],
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
    const posts = snapshot.docs.map((d) => toPost(d.id, d.data() as PostDoc));
    callback(posts);
  });
}

// Admin-only: every post regardless of status, for the dashboard overview,
// the "All gossips" tab, and printing. This query has no `where("status", ...)`
// clause, so Firestore can't prove every possible matched document is
// readable by a non-admin (the `read` rule depends on the per-document
// `status` field) and rejects the whole request with permission-denied for
// them, rather than silently trimming to the approved subset — only call
// this once `subscribeAdminSession` has confirmed the caller is an admin.
export function firestoreSubscribeToAllPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  const q = query(collection(db!, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => toPost(d.id, d.data() as PostDoc)));
    },
    (error) => {
      console.error("firestoreSubscribeToAllPosts listener error:", error);
    }
  );
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

export async function firestoreSetVisibilityWindow(
  value: VisibilitySettings
): Promise<void> {
  await setDoc(
    doc(db!, "settings", "moderation"),
    { visibilityWindow: value },
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
  const { requireApproval } = await readModerationSettings();

  await addDoc(collection(db!, "posts"), {
    text: input.text,
    imageUrl,
    nsfw: input.nsfw,
    createdAt: Timestamp.fromMillis(now),
    status: requireApproval ? "pending" : "approved",
    reactions: {},
    comments: [],
  } satisfies PostDoc);
}

// arrayUnion() appends atomically server-side, so concurrent commenters
// can't race and clobber each other's entry the way the reactions
// read-modify-write above can — no transaction needed.
export async function firestoreAddComment(postId: string, text: string): Promise<void> {
  const comment: GossipComment = { id: crypto.randomUUID(), text, createdAt: Date.now() };
  await updateDoc(doc(db!, "posts", postId), {
    comments: arrayUnion(comment),
  });
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

export async function firestoreSetNsfw(postId: string, nsfw: boolean): Promise<void> {
  await updateDoc(doc(db!, "posts", postId), { nsfw });
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
