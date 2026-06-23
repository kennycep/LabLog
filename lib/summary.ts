// Pure functions that turn logged data into shareable updates.
// No AI, no filler — every line is derived from what the user actually entered.

import { fmtHours, formatRange, inRange } from "./format";
import { labelFor, FILE_ISSUE_TYPES } from "./constants";
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

export interface SummaryData {
  range: { start: ISODate; end: ISODate; label: string };
  logs: DailyLog[];
  totalHours: number;
  totalLabHours: number;
  focusPoints: string[];
  progressPoints: string[];
  filesChecked: string[];
  blockerPoints: string[];
  questionPoints: string[];
  nextStepPoints: string[];
  activeGoals: Goal[];
  completedTasks: Task[];
  openFileIssues: FileIssue[];
  topTags: string[];
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
  const progressPoints = dedupe(logs.flatMap((l) => lines(l.progress)));
  const filesChecked = dedupe(logs.flatMap((l) => lines(l.filesTouched)));
  const nextStepPoints = dedupe(logs.flatMap((l) => lines(l.nextSteps)));

  // Blockers: from logs + open blocker records in range
  const logBlockers = logs.flatMap((l) => lines(l.blockers));
  const recordBlockers = input.blockers
    .filter((b) => b.status !== "resolved")
    .map((b) => b.title);
  const blockerPoints = dedupe([...logBlockers, ...recordBlockers]);

  // Questions: from logs + open blocker "needFromCameron"
  const logQuestions = logs.flatMap((l) => lines(l.questions));
  const recordQuestions = input.blockers
    .filter((b) => b.status !== "resolved" && b.needFromCameron.trim())
    .map((b) => b.needFromCameron.trim());
  const questionPoints = dedupe([...logQuestions, ...recordQuestions]);

  const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
  const totalLabHours = logs.reduce((s, l) => s + (l.labHours || 0), 0);

  // Tag frequency
  const tagCounts = new Map<string, number>();
  for (const l of logs)
    for (const t of l.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  const activeGoals = input.goals.filter((g) => g.status === "in_progress");
  const completedTasks = input.tasks.filter(
    (t) => t.status === "done" && inRange(t.updatedAt.slice(0, 10), start, end)
  );
  const openFileIssues = input.fileIssues.filter((f) => !f.resolved);

  return {
    range: { start, end, label: formatRange(start, end) },
    logs,
    totalHours,
    totalLabHours,
    focusPoints,
    progressPoints,
    filesChecked,
    blockerPoints,
    questionPoints,
    nextStepPoints,
    activeGoals,
    completedTasks,
    openFileIssues,
    topTags,
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

// ---- Generators ---------------------------------------------------------

export function generateSlack(d: SummaryData): string {
  const focus = d.focusPoints.length
    ? joinNatural(d.focusPoints.slice(0, 3))
    : "lab work";
  const progress = d.progressPoints.length
    ? joinNatural(d.progressPoints.slice(0, 3))
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
    `Quick update — this week I focused on ${focus}.`,
    `I made progress on ${progress}.`,
    `Main blocker/question is ${blocker}.`,
    `Next I'm planning to ${next}.`,
  ].join(" ");
}

export function generateTalkingPoints(d: SummaryData): string {
  const sections: string[] = [];
  sections.push(`Weekly check-in · ${d.range.label}`);
  sections.push(
    `Hours: ${fmtHours(d.totalHours)}h on task · ${fmtHours(d.totalLabHours)}h in lab`
  );
  sections.push("");
  sections.push("Main focus this week");
  sections.push(bullets(d.focusPoints));
  sections.push("");
  sections.push("Progress made");
  sections.push(bullets(d.progressPoints));
  sections.push("");
  sections.push("Files / data checked");
  sections.push(bullets(d.filesChecked));
  if (d.openFileIssues.length) {
    sections.push(
      bullets(
        d.openFileIssues
          .slice(0, 6)
          .map(
            (f) =>
              `${f.fileName || f.participantId || f.project}: ${labelFor(
                FILE_ISSUE_TYPES,
                f.issueType
              )}`
          )
      )
    );
  }
  sections.push("");
  sections.push("Blockers / errors");
  sections.push(bullets(d.blockerPoints, "• None this week"));
  sections.push("");
  sections.push("Questions for Cameron");
  sections.push(bullets(d.questionPoints, "• None right now"));
  sections.push("");
  sections.push("Next steps");
  sections.push(bullets(d.nextStepPoints));
  return sections.join("\n");
}

export function generateEmail(d: SummaryData): string {
  const focus = d.focusPoints.length
    ? joinNatural(d.focusPoints.slice(0, 4))
    : "my ongoing lab work";

  const body: string[] = [];
  body.push("Hi Cameron,");
  body.push("");
  body.push(
    `Here's my update for ${d.range.label}. This week I focused on ${focus}, logging ${fmtHours(
      d.totalHours
    )} hours of focused work (${fmtHours(d.totalLabHours)} hours in the lab).`
  );
  body.push("");

  if (d.progressPoints.length) {
    body.push("Progress:");
    body.push(bullets(d.progressPoints));
    body.push("");
  }
  if (d.blockerPoints.length) {
    body.push("Blockers / errors I ran into:");
    body.push(bullets(d.blockerPoints));
    body.push("");
  }
  if (d.questionPoints.length) {
    body.push("A few questions I'd value your input on:");
    body.push(bullets(d.questionPoints));
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
  out.push(`Blockers & questions · ${d.range.label}`);
  out.push("");
  out.push("Blockers / errors:");
  out.push(bullets(d.blockerPoints, "• None"));
  out.push("");
  out.push("Questions for Cameron:");
  out.push(bullets(d.questionPoints, "• None"));
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
  out.push(`Next week plan`);
  out.push("");
  out.push("Planned next steps (from daily logs):");
  out.push(bullets(d.nextStepPoints, "• Nothing logged yet"));
  if (d.activeGoals.length) {
    out.push("");
    out.push("Goals in progress:");
    out.push(
      bullets(
        d.activeGoals.map((g) =>
          g.nextMilestone
            ? `${g.title} → ${g.nextMilestone}`
            : g.title
        )
      )
    );
  }
  return out.join("\n");
}
