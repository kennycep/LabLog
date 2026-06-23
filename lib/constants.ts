import type {
  BlockerStatus,
  ConfidenceLevel,
  FileIssueType,
  FileStatus,
  GoalStatus,
  Priority,
  TaskStatus,
  Urgency,
} from "./types";

// Lab members — used by the optional "Worked for" field on a daily log.
export const LAB_MEMBERS = [
  "Cameron",
  "Mar",
  "Cliona",
  "Emily",
  "Sarah",
  "Alejandra",
  "Nicole",
] as const;

export const WORK_TAGS = [
  "Manual coding",
  "Python analysis",
  "Data cleaning",
  "Debugging",
  "Reading docs",
  "Meeting prep",
  "File organization",
  "Participant data",
  "Gaze coding",
  "Onboarding",
] as const;

export const CONFIDENCE_OPTIONS: { value: ConfidenceLevel; label: string }[] = [
  { value: "blocked", label: "Blocked" },
  { value: "struggling", label: "Struggling" },
  { value: "steady", label: "Steady" },
  { value: "confident", label: "Confident" },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const GOAL_STATUS_OPTIONS: { value: GoalStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export const BLOCKER_STATUS_OPTIONS: { value: BlockerStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "discussed", label: "Discussed" },
  { value: "resolved", label: "Resolved" },
];

export const TASK_COLUMNS: { value: TaskStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "this_week", label: "This Week" },
  { value: "today", label: "Today" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export const FILE_ISSUE_TYPES: { value: FileIssueType; label: string }[] = [
  { value: "missing_file", label: "Missing file" },
  { value: "mismatched_name", label: "Mismatched file name" },
  { value: "coder_file_issue", label: "Coder file issue" },
  { value: "empty_flash_count", label: "Empty flash count" },
  { value: "analysis_crash", label: "Analysis crash" },
  { value: "needs_review", label: "Needs review" },
  { value: "resolved", label: "Resolved" },
];

export const FILE_STATUS_OPTIONS: { value: FileStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

// Label lookup helpers
export function labelFor(
  options: { value: string; label: string }[],
  value: string
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
