import { VisibilitySettings } from "./types";

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

export const VISIBILITY_TIME_ZONE = "Europe/Stockholm";

// Wall-clock minutes-since-midnight for `date` in `timeZone`, DST-safe via Intl
// (no timezone library needed) — used to compare the visibility window against
// a fixed Gothenburg clock regardless of the viewer's own device timezone.
export function getMinutesInTimeZone(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

export function isWithinVisibilityWindow(
  window: VisibilitySettings,
  now: Date = new Date()
): boolean {
  if (!window.enabled) return true;
  const { startMinutes, endMinutes } = window;
  if (startMinutes === endMinutes) return true;

  const nowMinutes = getMinutesInTimeZone(now, VISIBILITY_TIME_ZONE);
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Window wraps past midnight (e.g. 22:00-02:00).
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}
