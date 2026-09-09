import { v4 as uuid } from "uuid";
import {
  DEFAULT_MODERATION_SETTINGS,
  GossipPost,
  ModerationSettings,
  NewPostInput,
  isPostExpired,
  visibilityToExpiresAt,
} from "./types";
import { toggleMyReaction } from "./reactionTracker";

const POSTS_KEY = "gossipbox_posts";
const SETTINGS_KEY = "gossipbox_settings";
const ADMIN_SESSION_KEY = "gossipbox_admin_local";

const bus = new EventTarget();
const adminBus = new EventTarget();

function readPosts(): GossipPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    const posts = JSON.parse(raw) as GossipPost[];
    // Backfill `comments` for posts saved before the field existed.
    return posts.map((p) => (p.comments ? p : { ...p, comments: [] }));
  } catch {
    return [];
  }
}

function writePosts(posts: GossipPost[]) {
  window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  bus.dispatchEvent(new Event("change"));
}

function emitApproved(callback: (posts: GossipPost[]) => void) {
  const posts = readPosts()
    .filter((p) => p.status === "approved" && !isPostExpired(p))
    .sort((a, b) => b.createdAt - a.createdAt);
  callback(posts);
}

export function localSubscribeToPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  emitApproved(callback);
  const handler = () => emitApproved(callback);
  bus.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    bus.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

function emitAll(callback: (posts: GossipPost[]) => void) {
  const posts = readPosts().sort((a, b) => b.createdAt - a.createdAt);
  callback(posts);
}

export function localSubscribeToAllPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  emitAll(callback);
  const handler = () => emitAll(callback);
  bus.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    bus.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function localReadModerationSettings(): ModerationSettings {
  if (typeof window === "undefined") return DEFAULT_MODERATION_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    return raw
      ? { ...DEFAULT_MODERATION_SETTINGS, ...(JSON.parse(raw) as ModerationSettings) }
      : DEFAULT_MODERATION_SETTINGS;
  } catch {
    return DEFAULT_MODERATION_SETTINGS;
  }
}

export function localSubscribeModerationSettings(
  callback: (settings: ModerationSettings) => void
): () => void {
  callback(localReadModerationSettings());
  const handler = () => callback(localReadModerationSettings());
  bus.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    bus.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function localSetRequireApproval(value: boolean): Promise<void> {
  const current = localReadModerationSettings();
  window.localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ ...current, requireApproval: value })
  );
  bus.dispatchEvent(new Event("change"));
}

export async function localCreatePost(input: NewPostInput): Promise<void> {
  const now = Date.now();
  const { requireApproval } = localReadModerationSettings();
  const post: GossipPost = {
    id: uuid(),
    text: input.text,
    imageUrl: input.imageDataUrl,
    nsfw: input.nsfw,
    createdAt: now,
    expiresAt: visibilityToExpiresAt(input.visibility, now),
    status: requireApproval ? "pending" : "approved",
    reactions: {},
    comments: [],
  };
  const posts = readPosts();
  posts.push(post);
  writePosts(posts);
}

export async function localToggleReaction(
  postId: string,
  emoji: string
): Promise<void> {
  const posts = readPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  const nowActive = toggleMyReaction(postId, emoji);
  const current = post.reactions[emoji] ?? 0;
  post.reactions[emoji] = Math.max(0, current + (nowActive ? 1 : -1));
  writePosts(posts);
}

export async function localAddComment(postId: string, text: string): Promise<void> {
  const posts = readPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;
  post.comments.push({ id: uuid(), text, createdAt: Date.now() });
  writePosts(posts);
}

export async function localSetPostStatus(
  postId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const posts = readPosts();
  const post = posts.find((p) => p.id === postId);
  if (!post) return;
  post.status = status;
  writePosts(posts);
}

// --- Local demo-mode admin session (passcode gate; not real security) ---

const LOCAL_ADMIN_PASSCODE =
  process.env.NEXT_PUBLIC_LOCAL_ADMIN_PASSCODE || "admin1234";

export function localIsAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function localAdminLogin(passcode: string): boolean {
  if (passcode !== LOCAL_ADMIN_PASSCODE) return false;
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  adminBus.dispatchEvent(new Event("change"));
  return true;
}

export function localAdminLogout(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  adminBus.dispatchEvent(new Event("change"));
}

export function localSubscribeAdminSession(
  callback: (isAdmin: boolean) => void
): () => void {
  callback(localIsAdminSession());
  const handler = () => callback(localIsAdminSession());
  adminBus.addEventListener("change", handler);
  return () => adminBus.removeEventListener("change", handler);
}
