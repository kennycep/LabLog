"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { TextInput } from "./Field";
import { fmtHours, isoDaysAgo, startOfWeekISO, todayISO } from "@/lib/format";
import {
  buildSummaryData,
  generateBlockerList,
  generateEmail,
  generateMeetingAgenda,
  generateNextWeekPlan,
  generateSlack,
  type SummaryInput,
} from "@/lib/summary";
import type { Blocker, DailyLog, FileIssue, Goal, Task } from "@/lib/types";

type Tab = "agenda" | "slack" | "email" | "blockers" | "next";

const TABS: { value: Tab; label: string }[] = [
  { value: "agenda", label: "Meeting agenda" },
  { value: "slack", label: "Slack update" },
  { value: "email", label: "Email" },
  { value: "blockers", label: "Blockers & decisions" },
  { value: "next", label: "Next week" },
];

export function WeeklySummaryGenerator({
  logs,
  tasks,
  blockers,
  goals,
  fileIssues,
}: {
  logs: DailyLog[];
  tasks: Task[];
  blockers: Blocker[];
  goals: Goal[];
  fileIssues: FileIssue[];
}) {
  const [start, setStart] = useState(startOfWeekISO());
  const [end, setEnd] = useState(todayISO());
  const [tab, setTab] = useState<Tab>("agenda");

  const input: SummaryInput = useMemo(
    () => ({ start, end, logs, tasks, blockers, goals, fileIssues }),
    [start, end, logs, tasks, blockers, goals, fileIssues]
  );
  const data = useMemo(() => buildSummaryData(input), [input]);

  const outputs: Record<Tab, string> = useMemo(
    () => ({
      agenda: generateMeetingAgenda(data),
      slack: generateSlack(data),
      email: generateEmail(data),
      blockers: generateBlockerList(data),
      next: generateNextWeekPlan(data),
    }),
    [data]
  );

  const hasData = data.logs.length > 0;

  function quickRange(days: number) {
    setStart(isoDaysAgo(days - 1));
    setEnd(todayISO());
  }

  return (
    <div className="space-y-6">
      {/* Range + primary copy actions */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">From</label>
            <TextInput
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
              className="w-auto"
            />
          </div>
          <div>
            <label className="label">To</label>
            <TextInput
              type="date"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => quickRange(7)} className="btn-ghost h-9">
              This week
            </button>
            <button onClick={() => quickRange(14)} className="btn-ghost h-9">
              Last 14d
            </button>
          </div>
          {hasData && (
            <div className="ml-auto flex gap-2">
              <CopyButton
                text={outputs.slack}
                label="Copy Slack update"
                className="h-9"
              />
              <CopyButton
                text={outputs.agenda}
                label="Copy meeting agenda"
                className="h-9"
              />
            </div>
          )}
        </div>
      </div>

      {/* Time + signal strip */}
      <div className="panel grid grid-cols-2 divide-border p-5 sm:grid-cols-4 sm:divide-x">
        <Metric label="In lab" value={`${fmtHours(data.totalLabHours)} h`} accent />
        <Metric label="Focused work" value={`${fmtHours(data.totalFocusedHours)} h`} />
        <Metric
          label="Blockers / questions"
          value={String(data.blockerPoints.length + data.questionPoints.length)}
        />
        <Metric label="Open file issues" value={String(data.openFileIssues.length)} />
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-fg">No entries in this range</p>
          <p className="mt-1 text-sm text-muted">
            Pick a range that includes some notebook entries, or log a session
            first. The agenda is built entirely from what you&apos;ve recorded.
          </p>
        </div>
      ) : (
        <div className="panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-1 border-b border-border pb-3">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={
                  tab === t.value
                    ? "rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Generated from your entries · {data.range.label}
            </p>
            <CopyButton text={outputs[tab]} className="h-8" />
          </div>

          <pre className="scroll-thin max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-2/50 p-4 font-sans text-sm leading-relaxed text-fg">
            {outputs[tab]}
          </pre>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="px-1 first:pl-0 sm:px-4">
      <p
        className={`text-xl font-semibold tracking-tight ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
