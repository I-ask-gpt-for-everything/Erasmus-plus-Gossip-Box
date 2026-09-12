import { v4 as uuid } from "uuid";

const AUTHOR_ID_KEY = "gossipbox_author_id";

// Holds the id when localStorage is unavailable (Safari private mode, a
// browser set to block site data) so it at least stays stable for the life of
// the page instead of changing on every call.
let memoryFallbackId: string | null = null;

// A per-browser id stamped onto Kind Words messages and Photos & Personal
// Info entries at creation, letting the originating browser edit/delete
// its own entries later. Since both collections are publicly readable,
// this id isn't a secret — it deters accidental/casual cross-editing but
// isn't cryptographically enforceable against a determined actor, the
// same tradeoff already accepted for reactions and the local admin
// passcode elsewhere in this app.
//
// Both localStorage accesses are guarded the same way readReacted() and the
// local backends' readers are: a browser with site data blocked throws on the
// getItem/setItem itself, and this runs on a path where an exception would
// take the whole board down with it. uuid() rather than crypto.randomUUID()
// because the latter is undefined outside a secure context — i.e. when testing
// over plain http on a phone — and this module is imported by both boards.
export function getAuthorId(): string {
  if (typeof window === "undefined") return "";

  try {
    const stored = window.localStorage.getItem(AUTHOR_ID_KEY);
    if (stored) return stored;
    const id = uuid();
    window.localStorage.setItem(AUTHOR_ID_KEY, id);
    return id;
  } catch {
    memoryFallbackId = memoryFallbackId ?? uuid();
    return memoryFallbackId;
  }
}
