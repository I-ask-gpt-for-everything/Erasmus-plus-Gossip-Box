const REACTED_KEY = "gossipbox_reactions";

function readReacted(): Record<string, string[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(REACTED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function writeReacted(map: Record<string, string[]>) {
  window.localStorage.setItem(REACTED_KEY, JSON.stringify(map));
}

export function getMyReactions(postId: string): Set<string> {
  return new Set(readReacted()[postId] ?? []);
}

/** Toggles the local "reacted with this emoji" flag and reports whether it is now active. */
export function toggleMyReaction(postId: string, emoji: string): boolean {
  const map = readReacted();
  const current = new Set(map[postId] ?? []);
  const nowActive = !current.has(emoji);
  if (nowActive) {
    current.add(emoji);
  } else {
    current.delete(emoji);
  }
  map[postId] = Array.from(current);
  writeReacted(map);
  return nowActive;
}
