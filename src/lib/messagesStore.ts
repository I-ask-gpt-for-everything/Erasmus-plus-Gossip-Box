import { isFirebaseConfigured } from "./firebase";
import { KindMessage, NewMessageInput } from "./types";
import {
  localSubscribeToMessages,
  localCreateMessage,
  localUpdateMessage,
  localDeleteMessage,
} from "./localMessagesBackend";
import {
  firestoreSubscribeToMessages,
  firestoreCreateMessage,
  firestoreUpdateMessage,
  firestoreDeleteMessage,
} from "./firestoreMessagesBackend";

export { getAuthorId } from "./authorTracker";
export { isFirebaseConfigured };

export function subscribeToMessages(
  callback: (messages: KindMessage[]) => void
): () => void {
  return isFirebaseConfigured
    ? firestoreSubscribeToMessages(callback)
    : localSubscribeToMessages(callback);
}

export function createMessage(input: NewMessageInput): Promise<void> {
  return isFirebaseConfigured ? firestoreCreateMessage(input) : localCreateMessage(input);
}

export function updateMessage(id: string, input: NewMessageInput): Promise<void> {
  return isFirebaseConfigured
    ? firestoreUpdateMessage(id, input)
    : localUpdateMessage(id, input);
}

export function deleteMessage(id: string): Promise<void> {
  return isFirebaseConfigured ? firestoreDeleteMessage(id) : localDeleteMessage(id);
}
