// Core data models for LabLog.
// These are storage-agnostic so the localStorage layer can later be swapped
// for Supabase rows with the same shapes.

export type ID = string;
export type ISODate = string; // "YYYY-MM-DD"
export type Timestamp = string; // ISO 8601

export interface BaseRecord {
  id: ID;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ConfidenceLevel = "blocked" | "struggling" | "steady" | "confident";

export type SessionType =
  | "lab"
  | "remote"
  | "meeting"
  | "coding"
  | "manual_coding"
  | "other";

// A single timed stretch of work within a day. A day can hold several.
export interface WorkSession {
  id: ID;
  timeIn: string; // "HH:MM" 24h, or "" if not set
  timeOut: string; // "HH:MM" 24h, or ""
  breakMinutes: number;
  sessionType: SessionType;
  overnight: boolean; // explicit: timeOut is on the next day
  notes: string;
  calculatedHours: number; // cached result of calculateSessionHours
}

export interface DailyLog extends BaseRecord {
  date: ISODate;
  sessions: WorkSession[];
  hoursOnTask: number; // focused task hours (manual or summed)
  manualLabHoursOverride: number | null; // overrides the session-summed lab hours
  focus: string;
  tags: string[];
  workedFor: string[]; // optional: lab members this work was for
  images: string[]; // resized data URLs (screenshots, photos of work)
  did: string;
  progress: string;
  filesTouched: string;
  blockers: string;
  tried: string;
  questions: string;
  nextSteps: string;
  confidence: ConfidenceLevel;

  // --- legacy (pre-sessions) fields, kept optional for migration only ---
  hours?: number;
  labHours?: number;
}

export type GoalStatus = "not_started" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high";

export interface Goal extends BaseRecord {
  title: string;
  description: string;
  status: GoalStatus;
  priority: Priority;
  targetDate: ISODate | "";
  currentMilestone: string;
  nextMilestone: string;
  notes: string;
}

export type TaskStatus = "backlog" | "this_week" | "today" | "blocked" | "done";

export interface Task extends BaseRecord {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  relatedGoalId: ID | "";
  dueDate: ISODate | "";
  notes: string;
  relatedFiles: string;
  questionForCameron: string;
  hoursSpent: number; // hours logged against this task
}

export type Urgency = "low" | "medium" | "high";
export type BlockerStatus = "open" | "discussed" | "resolved";

export interface Blocker extends BaseRecord {
  title: string;
  context: string;
  tried: string;
  needFromCameron: string;
  urgency: Urgency;
  relatedTaskId: ID | "";
  status: BlockerStatus;
}

export type FileIssueType =
  | "missing_file"
  | "mismatched_name"
  | "coder_file_issue"
  | "empty_flash_count"
  | "analysis_crash"
  | "needs_review"
  | "resolved";

export interface WeeklyReport extends BaseRecord {
  startDate: ISODate;
  endDate: ISODate;
  slackUpdate: string;
  meetingNotes: string;
  emailUpdate: string;
}

export type FileStatus = "open" | "in_progress" | "resolved";

export interface FileIssue extends BaseRecord {
  project: string;
  participantId: string;
  fileName: string;
  issueType: FileIssueType;
  status: FileStatus;
  notes: string;
  fixAttempted: string;
  resolved: boolean;
}
