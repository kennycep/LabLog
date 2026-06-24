// Pure functions that turn logged data into shareable updates.
// No AI, no filler — every line is derived from what the user actually entered.

import { fmtHours, formatDate, formatRange, inRange } from "./format";
import { labelFor, FILE_ISSUE_TYPES } from "./constants";
import {
  calculateWeeklyFocusedHours,
  calculateWeeklyLabHours,
  dailyLabHours,
  sessionRangeLabel,
} from "./time";
import type {
  Blocker,
  DailyLog,
  FileIssue,
  Goal,
  ISODate,
  Task,
} from "./types";

export interface SummaryInput {
  start: ISODate;
  end: ISODate;
  logs: DailyLog[];
  tasks: Task[];
  blockers: Blocker[];
  goals: Goal[];
  fileIssues: FileIssue[];
}

export interface DayBreakdown {
  date: ISODate;
  label: string;
  labHours: number;
  focusedHours: number;
  ranges: string[];
}

export interface SummaryData {
  range: { start: ISODate; end: ISODate; label: string };
  logs: DailyLog[];
  totalLabHours: number;
  totalFocusedHours: number;
  daysLogged: number;
  dayBreakdown: DayBreakdown[];
  focusPoints: string[];
  accomplishments: string[];
  filesChecked: string[];
  blockerPoints: string[];
  questionPoints: string[];
  decisionsNeeded: string[];
  nextStepPoints: string[];
  activeGoals: Goal[];
  completedTasks: Task[];
  openFileIssues: FileIssue[];
  topTags: string[];
  collaborators: string[];
}

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

export function buildSummaryData(input: SummaryInput): SummaryData {
  const { start, end } = input;
  const logs = input.logs
    .filter((l) => inRange(l.date, start, end))
    .sort((a, b) => a.date.localeCompare(b.date));

  const focusPoints = dedupe(logs.map((l) => l.focus.trim()).filter(Boolean));
  const accomplishments = dedupe([
    ...logs.flatMap((l) => lines(l.progress)),
    ...logs.flatMap((l) => lines(l.did)),
  ]);
  const filesChecked = dedupe(logs.flatMap((l) => lines(l.filesTouched)));
  const nextStepPoints = dedupe(logs.flatMap((l) => lines(l.nextSteps)));

  const logBlockers = logs.flatMap((l) => lines(l.blockers));
  const recordBlockers = input.blockers
    .filter((b) => b.status !== "resolved")
    .map((b) => b.title);
  const blockerPoints = dedupe([...logBlockers, ...recordBlockers]);

  const logQuestions = logs.flatMap((l) => lines(l.questions));
  const recordQuestions = input.blockers
    .filter((b) => b.status !== "resolved" && b.needFromCameron.trim())
    .map((b) => b.needFromCameron.trim());
  const questionPoints = dedupe([...logQuestions, ...recordQuestions]);

  // Decisions needed = what you explicitly need from Cameron.
  const decisionsNeeded = dedupe([
    ...recordQuestions,
    ...input.tasks
      .filter((t) => t.questionForCameron.trim())
      .map((t) => t.questionForCameron.trim()),
    ...logQuestions,
  ]);

  const totalLabHours = calculateWeeklyLabHours(logs);
  const totalFocusedHours = calculateWeeklyFocusedHours(logs);
  const daysLogged = new Set(logs.map((l) => l.date)).size;

  const dayBreakdown: DayBreakdown[] = logs.map((l) => ({
    date: l.date,
    label: formatDate(l.date),
    labHours: dailyLabHours(l),
    focusedHours: l.hoursOnTask || 0,
    ranges: l.sessions
      .map((s) => sessionRangeLabel(s))
      .filter((r): r is string => !!r),
  }));

  const tagCounts = new Map<string, number>();
  for (const l of logs)
    for (const t of l.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  const collaborators = dedupe(logs.flatMap((l) => l.workedFor ?? []));

  const activeGoals = input.goals.filter((g) => g.status === "in_progress");
  const completedTasks = input.tasks.filter(
    (t) => t.status === "done" && inRange(t.updatedAt.slice(0, 10), start, end)
  );
  const openFileIssues = input.fileIssues.filter((f) => !f.resolved);

  return {
    range: { start, end, label: formatRange(start, end) },
    logs,
    totalLabHours,
    totalFocusedHours,
    daysLogged,
    dayBreakdown,
    focusPoints,
    accomplishments,
    filesChecked,
    blockerPoints,
    questionPoints,
    decisionsNeeded,
    nextStepPoints,
    activeGoals,
    completedTasks,
    openFileIssues,
    topTags,
    collaborators,
  };
}

function joinNatural(items: string[]): string {
  const clean = items.map((i) => i.replace(/[.;]$/, ""));
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function bullets(items: string[], fallback = "—"): string {
  if (items.length === 0) return fallback;
  return items.map((i) => `• ${i}`).join("\n");
}

function timeSummaryLines(d: SummaryData): string[] {
  const out: string[] = [];
  out.push(
    `${fmtHours(d.totalLabHours)} h in lab · ${fmtHours(
      d.totalFocusedHours
    )} h focused · ${d.daysLogged} day${d.daysLogged === 1 ? "" : "s"} logged`
  );
  for (const day of d.dayBreakdown) {
    const range = day.ranges.length ? ` (${day.ranges.join(", ")})` : "";
    out.push(
      `• ${day.label}: ${fmtHours(day.labHours)} h lab${
        day.focusedHours ? `, ${fmtHours(day.focusedHours)} h focused` : ""
      }${range}`
    );
  }
  return out;
}

// ---- Generators ---------------------------------------------------------

export function generateSlack(d: SummaryData): string {
  const focus = d.focusPoints.length
    ? joinNatural(d.focusPoints.slice(0, 3))
    : "lab work";
  const progress = d.accomplishments.length
    ? joinNatural(d.accomplishments.slice(0, 3))
    : "moving things forward";
  const blocker = d.blockerPoints.length
    ? d.blockerPoints[0]
    : d.questionPoints.length
    ? d.questionPoints[0]
    : "nothing blocking right now";
  const next = d.nextStepPoints.length
    ? joinNatural(d.nextStepPoints.slice(0, 2))
    : "keep going on current tasks";

  return [
    `Quick update — this week I focused on ${focus} (${fmtHours(
      d.totalLabHours
    )} h in lab, ${fmtHours(d.totalFocusedHours)} h focused).`,
    `Made progress on ${progress}.`,
    `Main blocker/question: ${blocker}.`,
    `Next I'm planning to ${next}.`,
  ].join(" ");
}

// The full meeting-prep document.
export function generateMeetingAgenda(d: SummaryData): string {
  const s: string[] = [];
  s.push(`LAB MEETING AGENDA · ${d.range.label}`);
  s.push("");
  s.push("1. Main accomplishments");
  s.push(bullets(d.accomplishments.length ? d.accomplishments : d.focusPoints));
  s.push("");
  s.push("2. Time summary");
  s.push(timeSummaryLines(d).join("\n"));
  if (d.collaborators.length) {
    s.push(`Worked with: ${joinNatural(d.collaborators)}`);
  }
  s.push("");
  s.push("3. Files / data touched");
  s.push(bullets(d.filesChecked, "• None recorded"));
  if (d.openFileIssues.length) {
    s.push(
      bullets(
        d.openFileIssues
          .slice(0, 8)
          .map(
            (f) =>
              `${[f.project, f.participantId, f.fileName]
                .filter(Boolean)
                .join(" / ")} — ${labelFor(FILE_ISSUE_TYPES, f.issueType)}`
          )
      )
    );
  }
  s.push("");
  s.push("4. Current blockers / errors");
  s.push(bullets(d.blockerPoints, "• None this week"));
  s.push("");
  s.push("5. Decisions needed from Cameron");
  s.push(bullets(d.decisionsNeeded, "• None right now"));
  s.push("");
  s.push("6. Next week plan");
  s.push(bullets(d.nextStepPoints, "• To be set"));
  if (d.activeGoals.length) {
    s.push("");
    s.push("Goals in progress:");
    s.push(
      bullets(
        d.activeGoals.map((g) =>
          g.nextMilestone ? `${g.title} → ${g.nextMilestone}` : g.title
        )
      )
    );
  }
  return s.join("\n");
}

export function generateEmail(d: SummaryData): string {
  const focus = d.focusPoints.length
    ? joinNatural(d.focusPoints.slice(0, 4))
    : "my ongoing lab work";

  const body: string[] = [];
  body.push("Hi Cameron,");
  body.push("");
  body.push(
    `Here's my update for ${d.range.label}. This week I focused on ${focus}, with ${fmtHours(
      d.totalLabHours
    )} hours in the lab (${fmtHours(d.totalFocusedHours)} hours of focused work) across ${
      d.daysLogged
    } day${d.daysLogged === 1 ? "" : "s"}.${
      d.collaborators.length
        ? ` Some of this was alongside ${joinNatural(d.collaborators)}.`
        : ""
    }`
  );
  body.push("");

  if (d.accomplishments.length) {
    body.push("Main accomplishments:");
    body.push(bullets(d.accomplishments));
    body.push("");
  }
  if (d.blockerPoints.length) {
    body.push("Blockers / errors I ran into:");
    body.push(bullets(d.blockerPoints));
    body.push("");
  }
  if (d.decisionsNeeded.length) {
    body.push("Where I'd value your input:");
    body.push(bullets(d.decisionsNeeded));
    body.push("");
  }
  if (d.nextStepPoints.length) {
    body.push("Next week I'm planning to:");
    body.push(bullets(d.nextStepPoints));
    body.push("");
  }
  body.push("Thanks,");
  return body.join("\n");
}

export function generateBlockerList(d: SummaryData): string {
  const out: string[] = [];
  out.push(`Blockers & open questions · ${d.range.label}`);
  out.push("");
  out.push("Blockers / errors:");
  out.push(bullets(d.blockerPoints, "• None"));
  out.push("");
  out.push("Decisions needed from Cameron:");
  out.push(bullets(d.decisionsNeeded, "• None"));
  if (d.openFileIssues.length) {
    out.push("");
    out.push("Open file / data issues:");
    out.push(
      bullets(
        d.openFileIssues.map(
          (f) =>
            `${[f.project, f.participantId, f.fileName]
              .filter(Boolean)
              .join(" / ")} — ${labelFor(FILE_ISSUE_TYPES, f.issueType)}`
        )
      )
    );
  }
  return out.join("\n");
}

export function generateNextWeekPlan(d: SummaryData): string {
  const out: string[] = [];
  out.push("Next week plan");
  out.push("");
  out.push("Planned next steps (from your notebook):");
  out.push(bullets(d.nextStepPoints, "• Nothing logged yet"));
  if (d.activeGoals.length) {
    out.push("");
    out.push("Goals in progress:");
    out.push(
      bullets(
        d.activeGoals.map((g) =>
          g.nextMilestone ? `${g.title} → ${g.nextMilestone}` : g.title
        )
      )
    );
  }
  return out.join("\n");
}
