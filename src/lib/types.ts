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
  status: PostStatus;
  reactions: Record<string, number>;
  comments: GossipComment[];
}

export interface NewPostInput {
  text: string;
  imageDataUrl: string | null;
  nsfw: boolean;
}

export interface VisibilitySettings {
  enabled: boolean;
  startMinutes: number;
  endMinutes: number;
}

export const DEFAULT_VISIBILITY_SETTINGS: VisibilitySettings = {
  enabled: false,
  startMinutes: 600, // 10:00
  endMinutes: 780, // 13:00
};

export interface ModerationSettings {
  requireApproval: boolean;
  visibilityWindow: VisibilitySettings;
}

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  requireApproval: true,
  visibilityWindow: DEFAULT_VISIBILITY_SETTINGS,
};

export const MAX_MESSAGE_LENGTH = 600;
export const MAX_MESSAGE_NAME_LENGTH = 60;

export interface KindMessage {
  id: string;
  name: string;
  photoUrl: string | null;
  text: string;
  createdAt: number;
  authorId: string;
  deleted?: boolean;
}

export interface NewMessageInput {
  name: string;
  text: string;
  photoDataUrl: string | null;
}

export const MAX_PHOTO_ENTRY_TEXT_LENGTH = 600;
export const MAX_PHOTO_ENTRY_USERNAME_LENGTH = 60;
export const MAX_PHOTO_LINK_LENGTH = 500;
export const MAX_INSTAGRAM_HANDLE_LENGTH = 40;
export const MAX_CITY_LENGTH = 60;

// Photos & Personal Info board: like Kind Words, named and unmoderated, but
// each entry can carry a pasted photo link (shown as plain text/a link,
// not necessarily an uploadable image), an Instagram handle, the city they
// live in, and/or an actual uploaded picture — any combination alongside the
// username. Like `instagram`, `city` is extra info only: it doesn't count
// toward the "at least one of text / photoLink / photo" posting requirement.
export interface PhotoEntry {
  id: string;
  username: string;
  text: string;
  photoLink: string | null;
  instagram: string | null;
  city: string | null;
  photoUrl: string | null;
  createdAt: number;
  authorId: string;
  deleted?: boolean;
}

export interface NewPhotoEntryInput {
  username: string;
  text: string;
  photoLink: string | null;
  instagram: string | null;
  city: string | null;
  photoDataUrl: string | null;
}

