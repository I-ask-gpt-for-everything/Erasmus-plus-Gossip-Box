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
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // "" during the server render, where there's no localStorage to read — which
  // is also what a pre-authorId message backfills its own authorId to, so
  // isOwner below has to reject the empty id rather than let "" === "" hand
  // every visitor edit rights over every legacy entry.
  const [myAuthorId] = useState(() => getAuthorId());

  useEffect(() => subscribeToMessages(setMessages), []);
  useEffect(() => subscribeAdminSession(setIsAdmin), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

  // Reports success rather than rethrowing: the modal awaits this from an
  // onClick handler, so a thrown error would escape as an unhandled rejection
  // (and Next's dev overlay) instead of just keeping the modal open.
  async function handleSubmit(input: NewMessageInput): Promise<boolean> {
    try {
      if (editingMessage) {
        await updateMessage(editingMessage.id, input);
        setToast({ text: "Message updated." });
      } else {
        await createMessage(input);
        setToast({ text: "Your message is up. Thank you! 💌" });
      }
      return true;
    } catch (error) {
      console.error("Failed to save message:", error);
      setToast({ text: "Couldn't save — please try again.", error: true });
      return false;
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMessage(id);
      setToast({ text: "Message deleted." });
    } catch (error) {
      console.error("Failed to delete message:", error);
      setToast({ text: "Couldn't delete — please try again.", error: true });
    }
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

      {/* Above the compose modal's z-50: a failed save leaves the modal open,
          and the toast explaining why has to be readable over it. */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 z-[60] -translate-x-1/2 rounded-full border px-4 py-2 text-sm shadow-lg ${
            toast.error
              ? "bg-red-950 border-red-500/40 text-red-200"
              : "bg-neutral-800 border-white/10 text-white"
          }`}
        >
          {toast.text}
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
                isOwner={!!myAuthorId && message.authorId === myAuthorId}
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
