const AUTHOR_ID_KEY = "gossipbox_author_id";

// A per-browser id stamped onto Kind Words messages and Photos & Personal
// Info entries at creation, letting the originating browser edit/delete
// its own entries later. Since both collections are publicly readable,
// this id isn't a secret — it deters accidental/casual cross-editing but
// isn't cryptographically enforceable against a determined actor, the
// same tradeoff already accepted for reactions and the local admin
// passcode elsewhere in this app.
export function getAuthorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(AUTHOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(AUTHOR_ID_KEY, id);
  }
  return id;
}
