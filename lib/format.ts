import type { ISODate } from "./types";

export function todayISO(): ISODate {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number): ISODate {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

// Monday-based start of the current week.
export function startOfWeekISO(ref: Date = new Date()): ISODate {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function formatDate(iso: ISODate): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(iso: ISODate): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRange(start: ISODate, end: ISODate): string {
  if (!start || !end) return "";
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const sameMonth =
    s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sameYear = s.getFullYear() === e.getFullYear();

  // Build manually — passing non-contiguous skeletons (year+day, no month) to
  // toLocaleDateString produces garbled output in some locales.
  const sFmt = s.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (sameMonth) {
    // "Jun 22–23, 2026"
    return `${sFmt}–${e.getDate()}, ${e.getFullYear()}`;
  }
  const eFmt = e.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  // "Dec 30, 2025 – Jan 3, 2026" or "Jun 22 – Jul 3, 2026"
  const sWithYear = sameYear
    ? sFmt
    : `${sFmt}, ${s.getFullYear()}`;
  return `${sWithYear} – ${eFmt}`;
}

export function inRange(date: ISODate, start: ISODate, end: ISODate): boolean {
  return date >= start && date <= end;
}

// Round to one decimal, drop trailing ".0".
export function fmtHours(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
