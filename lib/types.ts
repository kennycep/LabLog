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

export interface DailyLog extends BaseRecord {
  date: ISODate;
  hours: number; // hours spent on tasks (focused work)
  labHours: number; // total hours physically in lab
  focus: string;
  tags: string[];
  did: string;
  progress: string;
  filesTouched: string;
  blockers: string;
  tried: string;
  questions: string;
  nextSteps: string;
  confidence: ConfidenceLevel;
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
