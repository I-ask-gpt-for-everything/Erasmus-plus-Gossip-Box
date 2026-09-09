export type VisibilityDuration = "1h" | "6h" | "24h" | "forever";

export type PostStatus = "pending" | "approved" | "rejected";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export const MAX_COMMENT_LENGTH = 200;

export interface GossipComment {
  id: string;
  text: string;
  createdAt: number;
}

export interface GossipPost {
  id: string;
  text: string;
  imageUrl: string | null;
  nsfw: boolean;
  createdAt: number;
  expiresAt: number | null;
  status: PostStatus;
  reactions: Record<string, number>;
  comments: GossipComment[];
}

export interface NewPostInput {
  text: string;
  imageDataUrl: string | null;
  nsfw: boolean;
  visibility: VisibilityDuration;
}

export interface ModerationSettings {
  requireApproval: boolean;
}

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  requireApproval: true,
};

export const VISIBILITY_LABELS: Record<VisibilityDuration, string> = {
  "1h": "1 hour",
  "6h": "6 hours",
  "24h": "24 hours",
  forever: "Forever",
};

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_MESSAGE_NAME_LENGTH = 60;

export interface KindMessage {
  id: string;
  name: string;
  photoUrl: string | null;
  text: string;
  createdAt: number;
}

export interface NewMessageInput {
  name: string;
  text: string;
  photoDataUrl: string | null;
}

export function isPostExpired(post: Pick<GossipPost, "expiresAt">): boolean {
  return post.expiresAt !== null && post.expiresAt < Date.now();
}

export function visibilityToExpiresAt(
  visibility: VisibilityDuration,
  from: number
): number | null {
  switch (visibility) {
    case "1h":
      return from + 60 * 60 * 1000;
    case "6h":
      return from + 6 * 60 * 60 * 1000;
    case "24h":
      return from + 24 * 60 * 60 * 1000;
    case "forever":
      return null;
  }
}
