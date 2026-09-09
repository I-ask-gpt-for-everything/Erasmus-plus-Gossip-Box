import { isFirebaseConfigured } from "./firebase";
import { GossipPost, ModerationSettings, NewPostInput } from "./types";
import {
  localSubscribeToPosts,
  localSubscribeToAllPosts,
  localCreatePost,
  localToggleReaction,
  localAddComment,
  localSetPostStatus,
  localSubscribeModerationSettings,
  localSetRequireApproval,
} from "./localBackend";
import {
  firestoreSubscribeToPosts,
  firestoreSubscribeToAllPosts,
  firestoreCreatePost,
  firestoreToggleReaction,
  firestoreAddComment,
  firestoreSetPostStatus,
  firestoreSubscribeModerationSettings,
  firestoreSetRequireApproval,
} from "./firestoreBackend";

export { getMyReactions } from "./reactionTracker";
export { isFirebaseConfigured };

export function subscribeToPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeToPosts(callback)
    : localSubscribeToPosts(callback);
}

// Admin-only: every post regardless of status (dashboard overview, "All
// gossips" tab, printing).
export function subscribeToAllPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeToAllPosts(callback)
    : localSubscribeToAllPosts(callback);
}

export function subscribeModerationSettings(
  callback: (settings: ModerationSettings) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeModerationSettings(callback)
    : localSubscribeModerationSettings(callback);
}

export function setRequireApproval(value: boolean): Promise<void> {
  return isFirebaseConfigured
    ? firestoreSetRequireApproval(value)
    : localSetRequireApproval(value);
}

export function createPost(input: NewPostInput): Promise<void> {
  return isFirebaseConfigured ? firestoreCreatePost(input) : localCreatePost(input);
}

export function toggleReaction(postId: string, emoji: string): Promise<void> {
  return isFirebaseConfigured
    ? firestoreToggleReaction(postId, emoji)
    : localToggleReaction(postId, emoji);
}

export function addComment(postId: string, text: string): Promise<void> {
  return isFirebaseConfigured
    ? firestoreAddComment(postId, text)
    : localAddComment(postId, text);
}

export function approvePost(postId: string): Promise<void> {
  return isFirebaseConfigured
    ? firestoreSetPostStatus(postId, "approved")
    : localSetPostStatus(postId, "approved");
}

export function rejectPost(postId: string): Promise<void> {
  return isFirebaseConfigured
    ? firestoreSetPostStatus(postId, "rejected")
    : localSetPostStatus(postId, "rejected");
}
