import { isFirebaseConfigured } from "./firebase";
import { KindMessage, NewMessageInput } from "./types";
import { localSubscribeToMessages, localCreateMessage } from "./localMessagesBackend";
import {
  firestoreSubscribeToMessages,
  firestoreCreateMessage,
} from "./firestoreMessagesBackend";

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
