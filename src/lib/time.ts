export function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatTimeRemaining(expiresAt: number | null): string | null {
  if (expiresAt === null) return null;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return "expiring…";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `vanishes in ${minutes}m`;

  const hours = Math.floor(minutes / 60);
  return `vanishes in ${hours}h`;
}
