import { isFirebaseConfigured } from "./firebase";
import { GossipPost, ModerationSettings, NewPostInput } from "./types";
import {
  localSubscribeToPosts,
  localSubscribeToPendingPosts,
  localCreatePost,
  localToggleReaction,
  localSetPostStatus,
  localSubscribeModerationSettings,
  localSetRequireApproval,
} from "./localBackend";
import {
  firestoreSubscribeToPosts,
  firestoreSubscribeToPendingPosts,
  firestoreCreatePost,
  firestoreToggleReaction,
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

export function subscribeToPendingPosts(
  callback: (posts: GossipPost[]) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeToPendingPosts(callback)
    : localSubscribeToPendingPosts(callback);
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
