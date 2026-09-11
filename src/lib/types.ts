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

export interface ModerationSettings {
  requireApproval: boolean;
}

export const DEFAULT_MODERATION_SETTINGS: ModerationSettings = {
  requireApproval: true,
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

export const MAX_PHOTO_ENTRY_TEXT_LENGTH = 600;
export const MAX_PHOTO_ENTRY_USERNAME_LENGTH = 60;
export const MAX_PHOTO_LINK_LENGTH = 500;
export const MAX_INSTAGRAM_HANDLE_LENGTH = 40;

// Photos & Personal Info board: like Kind Words, named and unmoderated, but
// each entry can carry a pasted photo link (shown as plain text/a link,
// not necessarily an uploadable image), an Instagram handle, and/or an
// actual uploaded picture — any combination alongside the username.
export interface PhotoEntry {
  id: string;
  username: string;
  text: string;
  photoLink: string | null;
  instagram: string | null;
  photoUrl: string | null;
  createdAt: number;
}

export interface NewPhotoEntryInput {
  username: string;
  text: string;
  photoLink: string | null;
  instagram: string | null;
  photoDataUrl: string | null;
}

