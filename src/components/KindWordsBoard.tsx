"use client";

import { useEffect, useState } from "react";
import MessageCard from "./MessageCard";
import ComposeMessageModal from "./ComposeMessageModal";
import { KindMessage, NewMessageInput } from "@/lib/types";
import {
  subscribeToMessages,
  createMessage,
  updateMessage,
  deleteMessage,
  getAuthorId,
} from "@/lib/messagesStore";
import { subscribeAdminSession } from "@/lib/adminAuth";

export default function KindWordsBoard() {
  const [messages, setMessages] = useState<KindMessage[]>([]);
  const [composing, setComposing] = useState(false);
  const [editingMessage, setEditingMessage] = useState<KindMessage | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [myAuthorId] = useState(() => getAuthorId());

  useEffect(() => subscribeToMessages(setMessages), []);
  useEffect(() => subscribeAdminSession(setIsAdmin), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  async function handleSubmit(input: NewMessageInput) {
    if (editingMessage) {
      await updateMessage(editingMessage.id, input);
      setToast("Message updated.");
    } else {
      await createMessage(input);
      setToast("Your message is up. Thank you! 💌");
    }
  }

  async function handleDelete(id: string) {
    await deleteMessage(id);
    setToast("Message deleted.");
  }

  function openCompose() {
    setEditingMessage(null);
    setComposing(true);
  }

  function openEdit(message: KindMessage) {
    setEditingMessage(message);
    setComposing(true);
  }

  function closeCompose() {
    setComposing(false);
    setEditingMessage(null);
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">💌 Kind Words</h1>
            <p className="text-xs text-white/40">Leave a message, with your name on it</p>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-800 border border-white/10 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 flex-1 w-full">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-white/40">
            <span className="text-4xl">💌</span>
            <p className="text-sm">No messages yet. Be the first to leave a kind word.</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 gap-4">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                isOwner={message.authorId === myAuthorId}
                isAdmin={isAdmin}
                onEdit={() => openEdit(message)}
                onDelete={() => handleDelete(message.id)}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={openCompose}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-2xl text-white shadow-lg shadow-rose-500/30 hover:bg-rose-400 transition-colors"
        aria-label="New message"
      >
        +
      </button>

      {composing && (
        <ComposeMessageModal
          onClose={closeCompose}
          onSubmit={handleSubmit}
          initialValue={editingMessage ?? undefined}
        />
      )}
    </div>
  );
}
