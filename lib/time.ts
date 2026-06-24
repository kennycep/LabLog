// Time + session math for daily logs.
// Sessions store wall-clock "HH:MM" strings; these helpers turn them into
// hours and roll them up to day / week totals.

import { uid } from "./storage";
import type { DailyLog, WorkSession } from "./types";

export function newSession(partial: Partial<WorkSession> = {}): WorkSession {
  const s: WorkSession = {
    id: uid(),
    timeIn: "",
    timeOut: "",
    breakMinutes: 0,
    sessionType: "lab",
    overnight: false,
    notes: "",
    calculatedHours: 0,
    ...partial,
  };
  s.calculatedHours = calculateSessionHours(s);
  return s;
}

// Parse "HH:MM" → minutes since midnight, or null if blank/invalid.
function toMinutes(hhmm: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// Hours for a single session. If time-out is at or before time-in we treat it
// as zero unless the session is explicitly flagged as crossing midnight.
export function calculateSessionHours(s: {
  timeIn: string;
  timeOut: string;
  breakMinutes: number;
  overnight?: boolean;
}): number {
  const start = toMinutes(s.timeIn);
  let end = toMinutes(s.timeOut);
  if (start === null || end === null) return 0;
  if (end <= start) {
    if (s.overnight) end += 24 * 60;
    else return 0;
  }
  const net = end - start - (Number(s.breakMinutes) || 0);
  if (net <= 0) return 0;
  return Math.round((net / 60) * 100) / 100;
}

// Lab/session hours for a day: manual override wins; otherwise sum sessions.
export function calculateDailyLabHours(
  sessions: WorkSession[],
  manualOverride: number | null | undefined
): number {
  if (manualOverride !== null && manualOverride !== undefined && manualOverride !== 0) {
    return manualOverride;
  }
  const summed = (sessions ?? []).reduce(
    (acc, s) => acc + (s.calculatedHours || calculateSessionHours(s)),
    0
  );
  return Math.round(summed * 100) / 100;
}

export function dailyLabHours(log: DailyLog): number {
  return calculateDailyLabHours(log.sessions, log.manualLabHoursOverride);
}

// Focused/task hours for a day. Currently the manually entered number; falls
// back to lab hours only if nothing was entered and there are sessions.
export function dailyFocusedHours(log: DailyLog): number {
  if (log.hoursOnTask && log.hoursOnTask > 0) return log.hoursOnTask;
  return 0;
}

export function calculateWeeklyLabHours(logs: DailyLog[]): number {
  return round1(logs.reduce((acc, l) => acc + dailyLabHours(l), 0));
}

export function calculateWeeklyFocusedHours(logs: DailyLog[]): number {
  return round1(logs.reduce((acc, l) => acc + dailyFocusedHours(l), 0));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// "10:00" → "10:00 AM"
export function formatTime(hhmm: string): string {
  const mins = toMinutes(hhmm);
  if (mins === null) return "";
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Current local time as "HH:MM" for quick "clock in" buttons.
export function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

// A short "10:00 AM – 3:00 PM" label for a session (or "" if incomplete).
export function sessionRangeLabel(s: WorkSession): string {
  if (!s.timeIn || !s.timeOut) return "";
  return `${formatTime(s.timeIn)} – ${formatTime(s.timeOut)}${
    s.overnight ? " (+1)" : ""
  }`;
}
