import { createRepository, STORE_KEYS } from "./storage";
import { calculateSessionHours } from "./time";
import type {
  Blocker,
  DailyLog,
  FileIssue,
  Goal,
  Task,
  WorkSession,
} from "./types";

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normalizeSession(raw: unknown): WorkSession {
  const r = (raw ?? {}) as Record<string, unknown>;
  const s: WorkSession = {
    id: str(r.id) || Math.random().toString(36).slice(2, 8),
    timeIn: str(r.timeIn),
    timeOut: str(r.timeOut),
    breakMinutes: num(r.breakMinutes),
    sessionType: (typeof r.sessionType === "string"
      ? r.sessionType
      : "lab") as WorkSession["sessionType"],
    overnight: r.overnight === true,
    notes: str(r.notes),
    calculatedHours: 0,
  };
  s.calculatedHours = calculateSessionHours(s);
  return s;
}

// Upgrades pre-sessions logs: old `hours` → hoursOnTask, old `labHours` →
// manualLabHoursOverride (since it was a manually entered lab figure).
function normalizeDailyLog(raw: unknown): DailyLog {
  const r = (raw ?? {}) as Record<string, unknown>;
  const sessions = Array.isArray(r.sessions)
    ? (r.sessions as unknown[]).map(normalizeSession)
    : [];

  const hoursOnTask =
    typeof r.hoursOnTask === "number" ? r.hoursOnTask : num(r.hours);

  let manualLabHoursOverride: number | null = null;
  if (typeof r.manualLabHoursOverride === "number") {
    manualLabHoursOverride = r.manualLabHoursOverride;
  } else if (r.manualLabHoursOverride === null) {
    manualLabHoursOverride = null;
  } else if (sessions.length === 0 && typeof r.labHours === "number") {
    // Legacy record with no sessions — preserve the old lab-hours number.
    manualLabHoursOverride = r.labHours;
  }

  return {
    id: str(r.id),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
    date: str(r.date),
    sessions,
    hoursOnTask,
    manualLabHoursOverride,
    focus: str(r.focus),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    workedFor: Array.isArray(r.workedFor) ? (r.workedFor as string[]) : [],
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    did: str(r.did),
    progress: str(r.progress),
    filesTouched: str(r.filesTouched),
    blockers: str(r.blockers),
    tried: str(r.tried),
    questions: str(r.questions),
    nextSteps: str(r.nextSteps),
    confidence: (typeof r.confidence === "string"
      ? r.confidence
      : "steady") as DailyLog["confidence"],
  };
}

export const dailyLogRepo = createRepository<DailyLog>(
  STORE_KEYS.dailyLogs,
  normalizeDailyLog
);
export const goalRepo = createRepository<Goal>(STORE_KEYS.goals);
export const taskRepo = createRepository<Task>(STORE_KEYS.tasks);
export const blockerRepo = createRepository<Blocker>(STORE_KEYS.blockers);
export const fileIssueRepo = createRepository<FileIssue>(STORE_KEYS.fileIssues);
