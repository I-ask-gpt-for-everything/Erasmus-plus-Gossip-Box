import { v4 as uuid } from "uuid";
import { KindMessage, NewMessageInput } from "./types";
import { getAuthorId } from "./authorTracker";

const MESSAGES_KEY = "gossipbox_messages";

const bus = new EventTarget();

function readMessages(): KindMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as KindMessage[]).map((m) => ({
      ...m,
      authorId: m.authorId ?? "",
      deleted: m.deleted ?? false,
    }));
  } catch {
    return [];
  }
}

function writeMessages(messages: KindMessage[]) {
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  bus.dispatchEvent(new Event("change"));
}

function emit(callback: (messages: KindMessage[]) => void) {
  const messages = readMessages()
    .filter((m) => !m.deleted)
    .sort((a, b) => b.createdAt - a.createdAt);
  callback(messages);
}

export function localSubscribeToMessages(
  callback: (messages: KindMessage[]) => void
): () => void {
  emit(callback);
  const handler = () => emit(callback);
  bus.addEventListener("change", handler);
  window.addEventListener("storage", handler);
  return () => {
    bus.removeEventListener("change", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function localCreateMessage(input: NewMessageInput): Promise<void> {
  const message: KindMessage = {
    id: uuid(),
    name: input.name,
    photoUrl: input.photoDataUrl,
    text: input.text,
    createdAt: Date.now(),
    authorId: getAuthorId(),
  };
  const messages = readMessages();
  messages.push(message);
  writeMessages(messages);
}

export async function localUpdateMessage(id: string, input: NewMessageInput): Promise<void> {
  const messages = readMessages();
  const message = messages.find((m) => m.id === id);
  if (!message) return;
  message.name = input.name;
  message.text = input.text;
  message.photoUrl = input.photoDataUrl;
  writeMessages(messages);
}

export async function localDeleteMessage(id: string): Promise<void> {
  const messages = readMessages();
  const message = messages.find((m) => m.id === id);
  if (!message) return;
  message.deleted = true;
  writeMessages(messages);
}
