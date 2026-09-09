export type VisibilityDuration = "1h" | "6h" | "24h" | "forever";

export type PostStatus = "pending" | "approved" | "rejected";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "👍"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface GossipPost {
  id: string;
  text: string;
  imageUrl: string | null;
  nsfw: boolean;
  createdAt: number;
  expiresAt: number | null;
  status: PostStatus;
  reactions: Record<string, number>;
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
